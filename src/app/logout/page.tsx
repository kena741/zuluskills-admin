"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/supabaseClient";

export default function LogoutPage() {
    return (
        <Suspense fallback={<div className="min-h-[40vh] grid place-items-center">Signing out…</div>}>
            <LogoutContent />
        </Suspense>
    );

    function LogoutContent() {
        const router = useRouter();
        const q = useSearchParams();
        const redirect = q.get("redirect") || "/login";

        useEffect(() => {
            const run = async () => {
                try {
                    if (supabase) await supabase.auth.signOut();
                } finally {
                    router.replace(redirect);
                }
            };
            void run();
        }, [router, redirect]);

        return <div className="min-h-[40vh] grid place-items-center">Signing out…</div>;
    }
}
