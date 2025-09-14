import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { supabase } from "@/supabaseClient";

// Students table schema (assumed table name: students)
// Columns: id (uuid, pk, references auth.users(id) on delete cascade),
// display_name text, first_name text, last_name text, email text, avatar_url text,
// created_at timestamptz default now()
export type StudentRecord = {
    id: string; // uuid
    display_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    created_at?: string | null;
};

export type StudentsState = {
    items: StudentRecord[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error?: string | null;
    // Optional: progress maps keyed by studentId
    courseProgressByStudentId?: Record<string, Record<string, "in-progress" | "completed">>;
    lessonProgressByStudentId?: Record<string, Record<string, boolean>>;
    courseProgressStatus?: "idle" | "loading" | "succeeded" | "failed";
    lessonProgressStatus?: "idle" | "loading" | "succeeded" | "failed";
    courseProgressError?: string | null;
    lessonProgressError?: string | null;
};

const initialState: StudentsState = {
    items: [],
    status: "idle",
    error: null,
    courseProgressByStudentId: {},
    lessonProgressByStudentId: {},
    courseProgressStatus: "idle",
    lessonProgressStatus: "idle",
    courseProgressError: null,
    lessonProgressError: null,
};

// Fetch all students
export const fetchStudents = createAsyncThunk<
    StudentRecord[],
    void,
    { rejectValue: string }
>("students/fetchAll", async (_, { rejectWithValue }) => {
    try {
        const client = supabase;
        if (!client) return rejectWithValue("Supabase is not configured");
        const { data, error } = await client
            .from("profiles")
            .select(
                "id, display_name, first_name, last_name, email, avatar_url, created_at"
            )
            .order("created_at", { ascending: false });

        if (error) return rejectWithValue(error.message);
        return (data ?? []) as StudentRecord[];
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return rejectWithValue(msg);
    }
});

// Fetch a single student by id (optional convenience)
export const fetchStudentById = createAsyncThunk<
    StudentRecord | null,
    { id: string },
    { rejectValue: string }
>("students/fetchById", async ({ id }, { rejectWithValue }) => {
    try {
        const client = supabase;
        if (!client) return rejectWithValue("Supabase is not configured");
        const { data, error } = await client
            .from("students")
            .select(
                "id, display_name, first_name, last_name, email, avatar_url, created_at"
            )
            .eq("id", id)
            .maybeSingle();

        if (error) return rejectWithValue(error.message);
        return (data as StudentRecord) ?? null;
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return rejectWithValue(msg);
    }
});

// Fetch one student's course progress map: { [course_id]: "in-progress" | "completed" }
export const fetchStudentCourseProgress = createAsyncThunk<
    { studentId: string; map: Record<string, "in-progress" | "completed"> },
    { studentId: string; courseIds?: Array<string | number> },
    { rejectValue: string }
>("students/fetchCourseProgress", async ({ studentId, courseIds }, { rejectWithValue }) => {
    try {
        const client = supabase;
        if (!client) return rejectWithValue("Supabase is not configured");
        let query = client
            .from("user_course_progress")
            .select("course_id, completed")
            .eq("user_id", studentId);
        if (courseIds && courseIds.length > 0) {
            query = query.in("course_id", courseIds.map(String));
        }
        const { data, error } = await query;
        if (error) return rejectWithValue(error.message);
        const map: Record<string, "in-progress" | "completed"> = {};
        for (const row of (data ?? []) as Array<{ course_id: string | number; completed: boolean }>) {
            map[String(row.course_id)] = row.completed ? "completed" : "in-progress";
        }
        return { studentId, map };
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return rejectWithValue(msg);
    }
});

// Fetch one student's lesson progress map: { [lesson_id]: boolean }
export const fetchStudentLessonProgress = createAsyncThunk<
    { studentId: string; map: Record<string, boolean> },
    { studentId: string; lessonIds?: Array<string | number> },
    { rejectValue: string }
>("students/fetchLessonProgress", async ({ studentId, lessonIds }, { rejectWithValue }) => {
    try {
        const client = supabase;
        if (!client) return rejectWithValue("Supabase is not configured");
        let query = client
            .from("user_lesson_progress")
            .select("lesson_id, completed")
            .eq("user_id", studentId);
        if (lessonIds && lessonIds.length > 0) {
            query = query.in("lesson_id", lessonIds.map(String));
        }
        const { data, error } = await query;
        if (error) return rejectWithValue(error.message);
        const map: Record<string, boolean> = {};
        for (const row of (data ?? []) as Array<{ lesson_id: string | number; completed: boolean }>) {
            map[String(row.lesson_id)] = !!row.completed;
        }
        return { studentId, map };
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return rejectWithValue(msg);
    }
});

const studentsSlice = createSlice({
    name: "students",
    initialState,
    reducers: {
        setStudents(state, action: PayloadAction<StudentRecord[]>) {
            state.items = action.payload;
            state.status = "succeeded";
            state.error = null;
        },
        clearStudents(state) {
            state.items = [];
            state.status = "idle";
            state.error = null;
        },
        upsertStudent(state, action: PayloadAction<StudentRecord>) {
            const s = action.payload;
            const idx = state.items.findIndex((x) => String(x.id) === String(s.id));
            if (idx >= 0) state.items[idx] = s;
            else state.items.push(s);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchStudents.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchStudents.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.items = action.payload;
            })
            .addCase(fetchStudents.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload ?? "Failed to fetch students";
            })
            .addCase(fetchStudentById.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchStudentById.fulfilled, (state, action) => {
                state.status = "succeeded";
                const s = action.payload;
                if (!s) return;
                const idx = state.items.findIndex((x) => String(x.id) === String(s.id));
                if (idx >= 0) state.items[idx] = s;
                else state.items.push(s);
            })
            .addCase(fetchStudentById.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload ?? "Failed to fetch student";
            })
            // Course progress
            .addCase(fetchStudentCourseProgress.pending, (state) => {
                state.courseProgressStatus = "loading";
                state.courseProgressError = null;
            })
            .addCase(fetchStudentCourseProgress.fulfilled, (state, action) => {
                state.courseProgressStatus = "succeeded";
                const { studentId, map } = action.payload;
                if (!state.courseProgressByStudentId) state.courseProgressByStudentId = {};
                state.courseProgressByStudentId[String(studentId)] = map;
            })
            .addCase(fetchStudentCourseProgress.rejected, (state, action) => {
                state.courseProgressStatus = "failed";
                state.courseProgressError = action.payload ?? "Failed to fetch course progress";
            })
            // Lesson progress
            .addCase(fetchStudentLessonProgress.pending, (state) => {
                state.lessonProgressStatus = "loading";
                state.lessonProgressError = null;
            })
            .addCase(fetchStudentLessonProgress.fulfilled, (state, action) => {
                state.lessonProgressStatus = "succeeded";
                const { studentId, map } = action.payload;
                if (!state.lessonProgressByStudentId) state.lessonProgressByStudentId = {};
                state.lessonProgressByStudentId[String(studentId)] = map;
            })
            .addCase(fetchStudentLessonProgress.rejected, (state, action) => {
                state.lessonProgressStatus = "failed";
                state.lessonProgressError = action.payload ?? "Failed to fetch lesson progress";
            });
    },
});

export const { setStudents, clearStudents, upsertStudent } = studentsSlice.actions;
export default studentsSlice.reducer;

// Selectors
export const selectStudents = (state: { students: StudentsState }) => state.students.items;
export const selectStudentsStatus = (state: { students: StudentsState }) => state.students.status;
export const selectStudentsError = (state: { students: StudentsState }) => state.students.error;
export const selectStudentById = (
    state: { students: StudentsState },
    id: string
) => state.students.items.find((s) => String(s.id) === String(id)) ?? null;

// Progress selectors
export const selectStudentCourseProgress = (
    state: { students: StudentsState },
    studentId: string
) => state.students.courseProgressByStudentId?.[String(studentId)] ?? {};
export const selectStudentLessonProgress = (
    state: { students: StudentsState },
    studentId: string
) => state.students.lessonProgressByStudentId?.[String(studentId)] ?? {};
export const selectStudentCourseProgressStatus = (state: { students: StudentsState }) => state.students.courseProgressStatus ?? "idle";
export const selectStudentLessonProgressStatus = (state: { students: StudentsState }) => state.students.lessonProgressStatus ?? "idle";
export const selectStudentCourseProgressError = (state: { students: StudentsState }) => state.students.courseProgressError ?? null;
export const selectStudentLessonProgressError = (state: { students: StudentsState }) => state.students.lessonProgressError ?? null;
