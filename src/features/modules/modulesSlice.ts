import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { supabase } from "@/supabaseClient";

// Lesson record as stored in Supabase `lessons` table
export type LessonRecord = {
    id: number | string;
    module_id: number | string;
    title: string;
    slug?: string | null;
    content?: string | null; // rich text / markdown
    video_url?: string | null;
    duration_seconds?: number | null;
    // Derived UI-friendly fields (not stored in DB)
    type?: string | null; // e.g., video/text/task/quiz (derived: video if video_url present, else text)
    duration_minutes?: number | null; // derived from duration_seconds
    ordinal?: number | null;
    created_at?: string | null;
};

// Module record as stored in Supabase `modules` table
export type ModuleRecord = {
    id: number | string;
    course_id: number | string;
    title: string;
    description?: string | null;
    ordinal?: number | null;
    created_at?: string | null;
    // Optional nested lessons when requested via relational select
    lessons?: LessonRecord[] | null;
};

export type ModulesState = {
    items: ModuleRecord[];
    status: "idle" | "loading" | "succeeded" | "failed";
    error?: string | null;
};

const initialState: ModulesState = {
    items: [],
    status: "idle",
    error: null,
};

// Thunk to fetch modules. Optionally filter by course_id
export const fetchModules = createAsyncThunk<
    ModuleRecord[],
    { courseId?: number | string } | void,
    { rejectValue: string }
>("modules/fetchAll", async (args, { rejectWithValue }) => {
    try {
        // Include nested lessons by default; adjust column list to your schema
        const client = supabase;
        if (!client) return rejectWithValue("Supabase is not configured");
        // 1) Fetch modules first (no relational select to avoid FK/relationship naming issues)
        let query = client
            .from("modules")
            .select("id, course_id, title, description, ordinal, created_at");

        let courseId: number | string | undefined;
        if (args && typeof args === "object" && "courseId" in args) {
            courseId = (args as { courseId?: number | string }).courseId;
        }
        if (courseId !== undefined && courseId !== null && `${courseId}` !== "") {
            query = query.eq("course_id", courseId);
        }

        // Order by ordinal then created_at as a fallback
        query = query.order("ordinal", { ascending: true }).order("created_at", { ascending: true });

        const { data: modulesData, error: modulesError } = await query;
        if (modulesError) return rejectWithValue(modulesError.message);
        const modules = (modulesData ?? []) as ModuleRecord[];

        if (modules.length === 0) return modules;

        // 2) Fetch lessons for these modules in one go and group by module_id
        const moduleIds = modules.map((m) => m.id);
        const { data: lessonsData, error: lessonsError } = await client
            .from("lessons")
            .select(
                "id, module_id, title, slug, ordinal, content, video_url, duration_seconds, created_at"
            )
            .in("module_id", moduleIds as (number | string)[])
            .order("ordinal", { ascending: true })
            .order("created_at", { ascending: true });

        if (lessonsError) return rejectWithValue(lessonsError.message);

        const byModule = new Map<string, LessonRecord[]>();
        for (const raw of lessonsData ?? []) {
            const key = String(raw.module_id);
            const arr = byModule.get(key) ?? [];
            const type = raw.video_url ? "video" : "text";
            const duration_minutes = typeof raw.duration_seconds === "number" && !Number.isNaN(raw.duration_seconds)
                ? Math.max(1, Math.round(raw.duration_seconds / 60))
                : null;
            const l: LessonRecord = {
                id: raw.id,
                module_id: raw.module_id,
                title: raw.title,
                slug: raw.slug ?? null,
                content: raw.content ?? null,
                video_url: raw.video_url ?? null,
                duration_seconds: raw.duration_seconds ?? null,
                type,
                duration_minutes,
                ordinal: raw.ordinal ?? null,
                created_at: raw.created_at ?? null,
            };
            arr.push(l);
            byModule.set(key, arr);
        }

        // 3) Attach lessons to modules
        const enriched = modules.map((m) => ({
            ...m,
            lessons: byModule.get(String(m.id)) ?? [],
        }));

        return enriched;
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return rejectWithValue(msg);
    }
});

const modulesSlice = createSlice({
    name: "modules",
    initialState,
    reducers: {
        setModules(state, action: PayloadAction<ModuleRecord[]>) {
            state.items = action.payload;
            state.status = "succeeded";
            state.error = null;
        },
        clearModules(state) {
            state.items = [];
            state.status = "idle";
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchModules.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchModules.fulfilled, (state, action) => {
                state.status = "succeeded";
                // Merge modules by id instead of replacing all, so multiple per-course fetches accumulate
                const incoming = action.payload;
                const byId = new Map(state.items.map((m) => [String(m.id), m] as const));
                for (const m of incoming) {
                    byId.set(String(m.id), m);
                }
                state.items = Array.from(byId.values());
            })
            .addCase(fetchModules.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload ?? "Failed to fetch modules";
            });
    },
});

export const { setModules, clearModules } = modulesSlice.actions;
export default modulesSlice.reducer;

// Lightweight selectors
export const selectModules = (state: { modules: ModulesState }) => state.modules.items;
export const selectModulesStatus = (state: { modules: ModulesState }) => state.modules.status;
export const selectModulesError = (state: { modules: ModulesState }) => state.modules.error;
