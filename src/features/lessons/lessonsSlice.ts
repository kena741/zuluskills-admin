import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { supabase } from "@/supabaseClient";

// Lessons table entity (as provided)
export type LessonRecord = {
    id: number | string; // bigserial in DB
    module_id: number | string; // bigint FK -> modules.id
    title: string; // text
    slug?: string | null; // text
    ordinal: number; // int default 0
    content?: string | null; // text (markdown)
    video_url?: string | null; // text
    duration_seconds?: number | null; // int
    created_at?: string | null; // timestamptz
};

export type LessonsState = {
    items: LessonRecord[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error?: string | null;
};

const initialState: LessonsState = {
    items: [],
    status: "idle",
    error: null,
};

// Fetch lessons by one or many lesson IDs
export const fetchLessonsByIds = createAsyncThunk<
    LessonRecord[],
    { ids: Array<number | string> },
    { rejectValue: string }
>("lessons/fetchByIds", async ({ ids }, { rejectWithValue }) => {
    try {
        const client = supabase;
        if (!client) return rejectWithValue("Supabase is not configured");
        if (!ids || ids.length === 0) return [];

        const { data, error } = await client
            .from("lessons")
            .select(
                "id, module_id, title, slug, ordinal, content, video_url, duration_seconds, created_at"
            )
            .in("id", ids as (number | string)[])
            .order("created_at", { ascending: true });

        if (error) return rejectWithValue(error.message);
        const rows = (data ?? []) as LessonRecord[];
        // Preserve input order if desired
        const pos = new Map(ids.map((v, i) => [String(v), i] as const));
        return rows.sort((a, b) => (pos.get(String(a.id)) ?? 0) - (pos.get(String(b.id)) ?? 0));
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return rejectWithValue(msg);
    }
});

// Fetch a single lesson by its ID
export const fetchLessonById = createAsyncThunk<
    LessonRecord | null,
    { id: number | string },
    { rejectValue: string }
>("lessons/fetchById", async ({ id }, { rejectWithValue }) => {
    try {
        const client = supabase;
        if (!client) return rejectWithValue("Supabase is not configured");
        const { data, error } = await client
            .from("lessons")
            .select(
                "id, module_id, title, slug, ordinal, content, video_url, duration_seconds, created_at"
            )
            .eq("id", id)
            .maybeSingle();

        if (error) return rejectWithValue(error.message);
        return (data as LessonRecord) ?? null;
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return rejectWithValue(msg);
    }
});

const lessonsSlice = createSlice({
    name: "lessons",
    initialState,
    reducers: {
        setLessons(state, action: PayloadAction<LessonRecord[]>) {
            state.items = action.payload;
            state.status = "succeeded";
            state.error = null;
        },
        clearLessons(state) {
            state.items = [];
            state.status = "idle";
            state.error = null;
        },
        upsertLesson(state, action: PayloadAction<LessonRecord>) {
            const l = action.payload;
            const idx = state.items.findIndex((x) => `${x.id}` === `${l.id}`);
            if (idx >= 0) state.items[idx] = l;
            else state.items.push(l);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLessonsByIds.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchLessonsByIds.fulfilled, (state, action) => {
                state.status = "succeeded";
                // Merge without duplicating
                const incoming = action.payload;
                const byId = new Map(state.items.map((l) => [String(l.id), l] as const));
                for (const l of incoming) byId.set(String(l.id), l);
                state.items = Array.from(byId.values());
            })
            .addCase(fetchLessonsByIds.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload ?? "Failed to fetch lessons";
            })
            .addCase(fetchLessonById.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchLessonById.fulfilled, (state, action) => {
                state.status = "succeeded";
                const l = action.payload;
                if (!l) return;
                const idx = state.items.findIndex((x) => `${x.id}` === `${l.id}`);
                if (idx >= 0) state.items[idx] = l;
                else state.items.push(l);
            })
            .addCase(fetchLessonById.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload ?? "Failed to fetch lesson";
            });
    },
});

export const { setLessons, clearLessons, upsertLesson } = lessonsSlice.actions;
export default lessonsSlice.reducer;

// Selectors
export const selectLessons = (state: { lessons: LessonsState }) => state.lessons.items;
export const selectLessonsStatus = (state: { lessons: LessonsState }) => state.lessons.status;
export const selectLessonsError = (state: { lessons: LessonsState }) => state.lessons.error;
export const selectLessonsByModuleId = (state: { lessons: LessonsState }, moduleId: number | string) =>
    state.lessons.items.filter((l) => `${l.module_id}` === `${moduleId}`);
export const selectLessonById = (state: { lessons: LessonsState }, id: number | string) =>
    state.lessons.items.find((l) => `${l.id}` === `${id}`) ?? null;
export const selectLessonsByIds = (state: { lessons: LessonsState }, ids: Array<number | string>) => {
    const set = new Set(ids.map(String));
    return state.lessons.items.filter((l) => set.has(String(l.id)));
};
