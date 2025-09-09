"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchModules, selectModules } from "@/features/modules/modulesSlice";
import { supabase } from "@/supabaseClient";

export default function AdminModule() {
    const { moduleId } = useParams<{ moduleId: string }>();
    const dispatch = useAppDispatch();
    const modules = useAppSelector(selectModules);
    const mod = modules.find(m => `${m.id}` === `${moduleId}`) || null;

    useEffect(() => { dispatch(fetchModules()); }, [dispatch]);

    const lessons = useMemo(() => mod?.lessons ?? [], [mod]);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [ordinal, setOrdinal] = useState<number>((lessons?.length ?? 0) + 1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Module tests state
    type ModuleTest = { id: string | number; module_id: string | number; title: string; description?: string | null };
    const [tests, setTests] = useState<ModuleTest[]>([]);
    const [testTitle, setTestTitle] = useState("");
    const [testDesc, setTestDesc] = useState("");
    const [savingTest, setSavingTest] = useState(false);

    useEffect(() => { setOrdinal((lessons?.length ?? 0) + 1); }, [lessons?.length]);

    // Load module tests
    useEffect(() => {
        const loadTests = async () => {
            if (!supabase || !moduleId) return;
            const { data } = await supabase
                .from("module_tests")
                .select("id, module_id, title, description")
                .eq("module_id", moduleId);
            setTests((data as ModuleTest[] | null) ?? []);
        };
        void loadTests();
    }, [moduleId]);

    const onAddLesson = async (e: React.FormEvent) => {
        e.preventDefault(); setError(null);
        if (!supabase) { setError("Backend not configured."); return; }
        if (!title.trim()) { setError("Title is required."); return; }
        setSaving(true);
        const payload = {
            module_id: moduleId as string,
            title,
            content: content || null,
            ordinal,
            video_url: videoUrl || null,
        };
        const { error: err } = await supabase.from("lessons").insert(payload as unknown as Record<string, unknown>);
        setSaving(false);
        if (err) { setError(err.message); return; }
        setTitle(""); setContent(""); setVideoUrl("");
        dispatch(fetchModules());
    };

    const onAddTest = async (e: React.FormEvent) => {
        e.preventDefault(); setError(null);
        if (!supabase) { setError("Backend not configured."); return; }
        if (!testTitle.trim()) { setError("Test title is required."); return; }
        setSavingTest(true);
        const { error: err } = await supabase
            .from("module_tests")
            .insert({ module_id: moduleId, title: testTitle, description: testDesc || null });
        setSavingTest(false);
        if (err) { setError(err.message); return; }
        setTestTitle(""); setTestDesc("");
        const { data } = await supabase
            .from("module_tests")
            .select("id, module_id, title, description")
            .eq("module_id", moduleId);
        setTests((data as ModuleTest[] | null) ?? []);
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Manage Module</h1>
                    <div className="opacity-70 text-sm">{mod ? mod.title : "Loading…"}</div>
                </div>
                <Link className="underline" href={`/admin/courses/${mod?.course_id ?? ""}`}>← Back to course</Link>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <form onSubmit={onAddLesson} className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-4 space-y-3">
                    <div className="font-medium">Add lesson</div>
                    <div>
                        <label htmlFor="lesson-title" className="text-sm">Title</label>
                        <input id="lesson-title" className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="lesson-content" className="text-sm">Content</label>
                        <textarea id="lesson-content" className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20" value={content} onChange={(e) => setContent(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="lesson-video" className="text-sm">Video URL</label>
                        <input id="lesson-video" className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="lesson-ordinal" className="text-sm">Ordinal</label>
                        <input id="lesson-ordinal" type="number" min={1} className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20" value={ordinal} onChange={(e) => setOrdinal(Number(e.target.value))} />
                    </div>
                    {error && <div className="text-sm text-red-600 dark:text-red-300">{error}</div>}
                    <button disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium border bg-emerald-500 text-white disabled:opacity-60">{saving ? "Saving…" : "Create lesson"}</button>
                </form>

                <div className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-4">
                    <div className="font-medium mb-3">Lessons</div>
                    <ul className="space-y-2">
                        {lessons.map((l) => (
                            <li key={String(l.id)} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/10">
                                <div>
                                    <div className="font-medium">{l.title}</div>
                                    <div className="text-xs opacity-70">ord {l.ordinal ?? "-"}</div>
                                </div>
                                <Link className="text-sm underline" href={`/admin/lessons/${l.id}`}>Resources »</Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <form onSubmit={onAddTest} className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-4 space-y-3">
                    <div className="font-medium">Add module test</div>
                    <div>
                        <label htmlFor="test-title" className="text-sm">Title</label>
                        <input id="test-title" className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20" value={testTitle} onChange={(e) => setTestTitle(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="test-desc" className="text-sm">Description</label>
                        <textarea id="test-desc" className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20" value={testDesc} onChange={(e) => setTestDesc(e.target.value)} />
                    </div>
                    {error && <div className="text-sm text-red-600 dark:text-red-300">{error}</div>}
                    <button disabled={savingTest} className="px-4 py-2 rounded-lg text-sm font-medium border bg-emerald-500 text-white disabled:opacity-60">{savingTest ? "Saving…" : "Create test"}</button>
                </form>

                <div className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-4">
                    <div className="font-medium mb-3">Module tests</div>
                    <ul className="space-y-2">
                        {tests.map((t) => (
                            <li key={String(t.id)} className="rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/10">
                                <div className="font-medium">{t.title}</div>
                                {t.description && <div className="text-sm opacity-80">{t.description}</div>}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
