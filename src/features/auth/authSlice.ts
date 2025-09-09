import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { supabase } from "@/supabaseClient";

export type AuthUser = {
    id: string;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
};

export type AuthState = {
    user: AuthUser | null;
    status: "idle" | "loading" | "succeeded" | "failed";
    error?: string | null;
};

const initialState: AuthState = {
    user: null,
    status: "idle",
    error: null,
};

// Fetch current user's profile from Supabase profiles table
export const fetchUserProfile = createAsyncThunk<AuthUser | null, void, { rejectValue: string }>(
    "auth/fetchUserProfile",
    async (_, { rejectWithValue }) => {
        try {
            const client = supabase;
            if (!client) return rejectWithValue("Supabase is not configured");
            const { data: userRes, error: userErr } = await client.auth.getUser();
            if (userErr) return rejectWithValue(userErr.message);
            const authUser = userRes?.user;
            if (!authUser) return null;

            // Try to fetch from profiles table by id
            const { data, error } = await client
                .from("profiles")
                .select("id, email, first_name, last_name, avatar_url")
                .eq("id", authUser.id)
                .maybeSingle();
            if (error) return rejectWithValue(error.message);
            const row = (data ?? null) as
                | { id: string; email?: string | null; first_name?: string | null; last_name?: string | null; avatar_url?: string | null }
                | null;
            return {
                id: authUser.id,
                email: row?.email ?? authUser.email ?? null,
                firstName: row?.first_name ?? null,
                lastName: row?.last_name ?? null,
                avatarUrl: row?.avatar_url ?? null,
            };
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Unknown error";
            return rejectWithValue(msg);
        }
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        clearAuth(state) {
            state.user = null;
            state.status = "idle";
            state.error = null;
        },
        setAuthUser(state, action: PayloadAction<AuthUser | null>) {
            state.user = action.payload;
            state.status = action.payload ? "succeeded" : "idle";
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserProfile.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.user = action.payload;
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload ?? "Failed to fetch user profile";
            })
            .addCase(updateUserProfileName.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(updateUserProfileName.fulfilled, (state, action: PayloadAction<AuthUser | null>) => {
                state.status = "succeeded";
                state.user = action.payload;
            })
            .addCase(updateUserProfileName.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload ?? "Failed to update profile";
            });
    },
});

export const { clearAuth, setAuthUser } = authSlice.actions;
export default authSlice.reducer;

// Selectors (avoid RootState type to reduce coupling)
export const selectAuthUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthStatus = (state: { auth: AuthState }) => state.auth.status;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

// Update user's first and last name
export const updateUserProfileName = createAsyncThunk<
    AuthUser | null,
    { firstName: string; lastName: string },
    { rejectValue: string }
>("auth/updateUserProfileName", async ({ firstName, lastName }, { rejectWithValue }) => {
    try {
        const client = supabase;
        if (!client) return rejectWithValue("Supabase is not configured");
        const { data: userRes, error: userErr } = await client.auth.getUser();
        if (userErr) return rejectWithValue(userErr.message);
        const authUser = userRes?.user;
        if (!authUser) return rejectWithValue("not-authenticated");

        const { data, error } = await client
            .from("profiles")
            .update({ first_name: firstName, last_name: lastName })
            .eq("id", authUser.id)
            .select("id, email, first_name, last_name, avatar_url")
            .maybeSingle();
        if (error) return rejectWithValue(error.message);
        const row = (data ?? null) as { id: string; email?: string | null; first_name?: string | null; last_name?: string | null; avatar_url?: string | null } | null;
        return {
            id: authUser.id,
            email: row?.email ?? authUser.email ?? null,
            firstName: row?.first_name ?? null,
            lastName: row?.last_name ?? null,
            avatarUrl: row?.avatar_url ?? null,
        };
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return rejectWithValue(msg);
    }
});

// Inject updateUserProfileName into the slice's extraReducers
// We re-create the slice with the same name if needed; here, we patch builder below by augmenting the exported reducer via prototype is not possible.
// Instead, handle the update thunk by augmenting extraReducers above. This section is intentionally left blank as we already export the thunk.

