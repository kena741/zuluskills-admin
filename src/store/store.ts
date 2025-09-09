import { configureStore, combineReducers } from '@reduxjs/toolkit';
import type { UnknownAction } from '@reduxjs/toolkit';
import { resetStore } from './resetActions';
import coursesReducer from "@/features/courses/coursesSlice";
import modulesReducer from "@/features/modules/modulesSlice";
import lessonsReducer from "@/features/lessons/lessonsSlice";
import authReducer from "@/features/auth/authSlice";


// Register slice reducers here
const appReducer = combineReducers({
  auth: authReducer,
  courses: coursesReducer,
  modules: modulesReducer,
  lessons: lessonsReducer,
});

export type AppReducerState = ReturnType<typeof appReducer>;

// Reset the store when resetStore action is dispatched
const RESET_TYPE = resetStore.type;
const rootReducer = (
  state: AppReducerState | undefined,
  action: UnknownAction
): AppReducerState => {
  if (action && action.type === RESET_TYPE) {
    // Reset to initial state of all slices
    return appReducer(undefined, action) as AppReducerState;
  }
  return appReducer(state, action) as AppReducerState;
};

export const store = configureStore({
  reducer: rootReducer,

});

// Types for use throughout the app
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
