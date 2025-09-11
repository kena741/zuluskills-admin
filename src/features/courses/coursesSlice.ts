import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { supabase } from "@/supabaseClient";

// Basic Course type based on the Supabase table columns
export type Course = {
    id: number | string;
    slug: string;
    title: string;
    description?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    // Optional nested modules when fetched via fetchCourseById with nested select
    modules?: Array<{
        id: number | string;
        course_id: number | string;
        title: string;
        description?: string | null;
        ordinal?: number | null;
        created_at?: string | null;
    }> | null;
};

export type CoursesState = {
    items: Course[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error?: string | null;
    // Per-course progress for the authenticated user
    progress: Record<string, "in-progress" | "completed">;
    progressStatus: "idle" | "loading" | "succeeded" | "failed";
    progressError?: string | null;
};

const initialState: CoursesState = {
    items: [],
    status: "idle",
    error: null,
    progress: {},
    progressStatus: "idle",
    progressError: null,
};

// Thunk to fetch all courses from Supabase
export const fetchCourses = createAsyncThunk<Course[], void, { rejectValue: string }>(
    "courses/fetchAll",
    async (_, { rejectWithValue }) => {
        try {
            const client = supabase;
            if (!client) return rejectWithValue("Supabase is not configured");
            const { data, error } = await client
                .from("courses")
                .select("id, slug, title, description, created_at, updated_at")
                .order("created_at", { ascending: false });

            if (error) return rejectWithValue(error.message);
            return (data ?? []) as Course[];
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            return rejectWithValue(msg);
        }
    }
);

// Thunk to fetch only the current user's courses based on user_course_progress
export const fetchUserCourses = createAsyncThunk<Course[], void, { rejectValue: string }>(
    "courses/fetchUserCourses",
    async (_, { rejectWithValue }) => {
        try {
            const client = supabase;
            if (!client) return rejectWithValue("Supabase is not configured");
            const { data: userRes, error: userErr } = await client.auth.getUser();
            if (userErr) return rejectWithValue(userErr.message);
            const user = userRes?.user;
            if (!user) return [];
            // Get list of course IDs the user has progress for
            const { data: progressRows, error: progressErr } = await client
                .from("user_course_progress")
                .select("course_id")
                .eq("user_id", user.id);
            if (progressErr) return rejectWithValue(progressErr.message);
            const ids = Array.from(
                new Set(
                    ((progressRows ?? []) as Array<{ course_id: string | number }>).map((r) => String(r.course_id))
                )
            );
            if (ids.length === 0) return [];
            // Fetch those courses
            const { data: coursesData, error: coursesErr } = await client
                .from("courses")
                .select("id, slug, title, description, created_at, updated_at")
                .in("id", ids)
                .order("created_at", { ascending: false });
            if (coursesErr) return rejectWithValue(coursesErr.message);
            return (coursesData ?? []) as Course[];
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            return rejectWithValue(msg);
        }
    }
);

// Thunk to fetch a single course by ID
export const fetchCourseById = createAsyncThunk<
    Course | null,
    { id: number | string },
    { rejectValue: string }
>("courses/fetchById", async ({ id }, { rejectWithValue }) => {
    try {
        const client = supabase;
        if (!client) return rejectWithValue("Supabase is not configured");
        const { data, error } = await client
            .from("courses")
            .select("id, slug, title, description, created_at, updated_at, modules(id, course_id, title, description, ordinal, created_at)")
            .eq("id", id)
            .maybeSingle();

        if (error) return rejectWithValue(error.message);
        return (data as Course) ?? null;
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return rejectWithValue(msg);
    }
});

// Thunk to update a course by ID
export const updateCourse = createAsyncThunk<
    Course,
    { id: number | string; changes: Partial<Pick<Course, "title" | "description" | "slug">> },
    { rejectValue: string }
>("courses/update", async ({ id, changes }, { rejectWithValue }) => {
    try {
        const client = supabase;
        if (!client) return rejectWithValue("Supabase is not configured");
        const payload = { ...changes, updated_at: new Date().toISOString() };
        const { data, error } = await client
            .from("courses")
            .update(payload)
            .eq("id", id)
            .select("id, slug, title, description, created_at, updated_at")
            .maybeSingle();
        if (error) return rejectWithValue(error.message);
        if (!data) return rejectWithValue("Course not found after update");
        return data as Course;
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return rejectWithValue(msg);
    }
});

// Thunk to fetch the current user's progress for the listed courses in state
export const fetchUserCourseProgress = createAsyncThunk<
    Record<string, "in-progress" | "completed">,
    void,
    { state: { courses: CoursesState }, rejectValue: string }
>("courses/fetchUserCourseProgress", async (_, { getState, rejectWithValue }) => {
    try {
        const client = supabase;
        if (!client) return {}; // if not configured, just no progress
        const { data: userRes } = await client.auth.getUser();
        const user = userRes?.user;
        if (!user) return {}; // not signed in => no progress shown
        const ids = getState().courses.items.map((c) => String(c.id));
        if (ids.length === 0) return {};
        const { data, error } = await client
            .from("user_course_progress")
            .select("course_id, completed")
            .eq("user_id", user.id)
            .in("course_id", ids);
        if (error) return rejectWithValue(error.message);
        const map: Record<string, "in-progress" | "completed"> = {};
        for (const row of (data ?? []) as Array<{ course_id: string | number; completed: boolean }>) {
            map[String(row.course_id)] = row.completed ? "completed" : "in-progress";
        }
        return map;
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return rejectWithValue(msg);
    }
});

// Thunk to start a course (upsert progress row). Returns courseId on success.
export const startCourse = createAsyncThunk<
    { courseId: string },
    { courseId: string },
    { rejectValue: "not-authenticated" | string }
>("courses/startCourse", async ({ courseId }, { rejectWithValue }) => {
    try {
        const client = supabase;
        if (!client) return rejectWithValue("Supabase is not configured");
        const { data: userRes } = await client.auth.getUser();
        const user = userRes?.user;
        if (!user) return rejectWithValue("not-authenticated");
        const payload = {
            user_id: user.id,
            course_id: String(courseId),
            started_at: new Date().toISOString(),
        };
        const { error } = await client
            .from("user_course_progress")
            .upsert(payload, { onConflict: "user_id,course_id", ignoreDuplicates: true });
        if (error) return rejectWithValue(error.message);
        return { courseId: String(courseId) };
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return rejectWithValue(msg);
    }
});

const coursesSlice = createSlice({
    name: "courses",
    initialState,
    reducers: {
        // Allow manual set/clear if needed
        setCourses(state, action: PayloadAction<Course[]>) {
            state.items = action.payload;
            state.status = "succeeded";
            state.error = null;
        },
        clearCourses(state) {
            state.items = [];
            state.status = "idle";
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCourses.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchCourses.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.items = action.payload;
            })
            .addCase(fetchCourses.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload ?? "Failed to fetch courses";
            })
            // User courses only
            .addCase(fetchUserCourses.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchUserCourses.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.items = action.payload;
            })
            .addCase(fetchUserCourses.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload ?? "Failed to fetch user courses";
            })
            .addCase(fetchCourseById.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchCourseById.fulfilled, (state, action) => {
                state.status = "succeeded";
                const course = action.payload;
                if (!course) return; // not found, keep existing items
                const idx = state.items.findIndex((c) => `${c.id}` === `${course.id}`);
                if (idx >= 0) state.items[idx] = course;
                else state.items.push(course);
            })
            .addCase(fetchCourseById.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload ?? "Failed to fetch course";
            })
            // Progress fetching
            .addCase(fetchUserCourseProgress.pending, (state) => {
                state.progressStatus = "loading";
                state.progressError = null;
            })
            .addCase(fetchUserCourseProgress.fulfilled, (state, action) => {
                state.progressStatus = "succeeded";
                state.progress = action.payload;
            })
            .addCase(fetchUserCourseProgress.rejected, (state, action) => {
                state.progressStatus = "failed";
                state.progressError = action.payload ?? "Failed to fetch progress";
            })
            // Start course
            .addCase(startCourse.fulfilled, (state, action) => {
                const { courseId } = action.payload;
                state.progress[courseId] = "in-progress";
            })
            // Update course
            .addCase(updateCourse.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(updateCourse.fulfilled, (state, action) => {
                state.status = "succeeded";
                const updated = action.payload;
                const idx = state.items.findIndex((c) => `${c.id}` === `${updated.id}`);
                if (idx >= 0) state.items[idx] = { ...state.items[idx], ...updated };
                else state.items.push(updated);
            })
            .addCase(updateCourse.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload ?? "Failed to update course";
            });
    },
});

export const { setCourses, clearCourses } = coursesSlice.actions;
export default coursesSlice.reducer;

// Lightweight selectors without importing RootState to avoid circular deps
export const selectCourses = (state: { courses: CoursesState }) => state.courses.items;
export const selectCoursesStatus = (state: { courses: CoursesState }) => state.courses.status;
export const selectCoursesError = (state: { courses: CoursesState }) => state.courses.error;
export const selectCourseById = (
    state: { courses: CoursesState },
    id: number | string
) => state.courses.items.find((c) => `${c.id}` === `${id}`) ?? null;
export const selectCourseProgressMap = (state: { courses: CoursesState }) => state.courses.progress;
export const selectCourseProgressStatus = (state: { courses: CoursesState }) => state.courses.progressStatus;

// Mark a single lesson's progress for the current user
// Expects a Supabase table `user_lesson_progress` with columns:
// id (uuid, pk, default gen_random_uuid()), user_id (uuid), lesson_id (uuid),
// completed (boolean), completed_at (timestamptz), unique(user_id, lesson_id)
export const markLessonProgress = createAsyncThunk<
    { lessonId: string; completed: boolean; completed_at: string | null },
    { lessonId: string | number; completed: boolean },
    { rejectValue: "not-authenticated" | string }
>("courses/markLessonProgress", async ({ lessonId, completed }, { rejectWithValue }) => {
    try {
        const client = supabase;
        if (!client) return rejectWithValue("Supabase is not configured");
        const { data: userRes } = await client.auth.getUser();
        const user = userRes?.user;
        if (!user) return rejectWithValue("not-authenticated");

        const now = new Date().toISOString();
        const payload = {
            user_id: user.id,
            lesson_id: String(lessonId),
            completed,
            completed_at: completed ? now : null,
        };

        const { error } = await client
            .from("user_lesson_progress")
            .upsert(payload, { onConflict: "user_id,lesson_id" });
        if (error) return rejectWithValue(error.message);

        return { lessonId: String(lessonId), completed, completed_at: completed ? now : null };
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return rejectWithValue(msg);
    }
});
