"use client";
import { ReactNode, useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppDispatch } from './hooks';
import { supabase } from '@/supabaseClient';
import { clearAuth, fetchUserProfile } from '@/features/auth/authSlice';

export function ReduxProvider({ children }: { children: ReactNode }) {
  // Custom inner component to use hooks
  function AuthSync({ children }: { children: ReactNode }) {
    const dispatch = useAppDispatch();
    // Prevent infinite loop by tracking last userId
    const lastUserId = useRef<string | null>(null);
    useEffect(() => {
      if (!supabase) return; // demo/offline mode without backend
      const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
        if (session?.user) {
          if (lastUserId.current !== session.user.id) {
            lastUserId.current = session.user.id;
            // Pull latest profile for this user
            dispatch(fetchUserProfile());
          }
        } else {
          if (lastUserId.current !== null) {
            lastUserId.current = null;
            dispatch(clearAuth());
          }
        }
      });
      return () => {
        listener?.subscription.unsubscribe();
      };
    }, [dispatch]);
    return <>{children}</>;
  }
  return (
    <Provider store={store}>
      <AuthSync>{children}</AuthSync>
    </Provider>
  );
}
