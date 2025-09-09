"use client";


import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/supabaseClient";


function LoginPageInner() {
    const router = useRouter();
    const q = useSearchParams();
    const redirect = q.get("redirect") || "/dashboard";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    const onPasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault(); setError(null); setInfo(null);
        if (!email.trim()) { setError("Email is required"); return; }
        if (!supabase) { // demo mode
            router.replace(redirect);
            return;
        }
        setLoading(true);
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        setLoading(false);
        if (err) { setError(err.message); return; }
        router.replace(redirect);
    };

    const onMagicLink = async (e: React.FormEvent) => {
        e.preventDefault(); setError(null); setInfo(null);
        if (!email.trim()) { setError("Email is required"); return; }
        if (!supabase) { setInfo("Demo mode: magic link disabled. Use demo login below."); return; }
        setLoading(true);
        const { error: err } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin + redirect } });
        setLoading(false);
        if (err) { setError(err.message); return; }
        setInfo("Check your inbox for a login link.");
    };

    return (
        <div className="relative">
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[420px] w-[720px] rounded-full blur-3xl bg-gradient-to-br from-sky-400/20 via-fuchsia-400/10 to-emerald-400/20 dark:from-cyan-300/15 dark:via-violet-400/10 dark:to-lime-300/15" />
            </div>

            <div className="min-h-[60vh] grid place-items-center px-4 py-10">
                <div className="w-full max-w-md rounded-2xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur p-6 shadow-sm space-y-5">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Student login</h1>
                        <p className="text-sm opacity-70">Sign in with your email and password, or use a magic link.</p>
                    </div>

                    <form onSubmit={onPasswordLogin} className="space-y-3">
                        <div>
                            <label htmlFor="email" className="text-sm">Email</label>
                            <input id="email" type="email" placeholder="you@example.com" className="mt-1 w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <label htmlFor="password" className="text-sm">Password</label>
                            <input id="password" type="password" placeholder="••••••••" className="mt-1 w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                        {error && <div className="text-sm text-red-600 dark:text-red-300">{error}</div>}
                        {info && <div className="text-sm text-emerald-700 dark:text-emerald-300">{info}</div>}
                        <button disabled={loading} className="w-full px-4 py-2 rounded-lg text-sm font-medium border bg-emerald-500 text-white disabled:opacity-60">{loading ? "Signing in…" : "Sign in"}</button>
                    </form>

                    <div className="flex items-center gap-2 text-xs opacity-70">
                        <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                        or
                        <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                    </div>

                    <form onSubmit={onMagicLink} className="space-y-3">
                        <div className="flex items-end gap-2">
                            <div className="flex-1">
                                <label htmlFor="email2" className="text-sm">Email</label>
                                <input id="email2" type="email" placeholder="you@example.com" className="mt-1 w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <button className="px-4 py-2 rounded-lg text-sm font-medium border bg-black/5 dark:bg-white/10">Send link</button>
                        </div>
                    </form>

                    <div className="flex items-center gap-2 text-xs opacity-70">
                        <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                        or
                        <div className="h-px flex-1 bg-black/10 dark:bg-white/10" />
                    </div>

                    <div className="text-xs opacity-70 text-center">
                        Trouble signing in? <Link className="underline" href="/">Go home</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginPageInner />
        </Suspense>
    );
}
