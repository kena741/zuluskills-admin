"use client";

import { useEffect, useMemo, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchModules, selectModules } from "@/features/modules/modulesSlice";
import { updateLesson } from "@/features/lessons/lessonsSlice";
import RichTextEditor from "@/components/editor/RichTextEditor";
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
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [success, setSuccess] = useState(false);
    // Edit Lesson state
    const [showLessonEditModal, setShowLessonEditModal] = useState(false);
    const [editLessonId, setEditLessonId] = useState<number | string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editVideoUrl, setEditVideoUrl] = useState("");
    const [editOrdinal, setEditOrdinal] = useState<number>(1);
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);
    // Module tests state
    type ModuleTest = { id: string | number; module_id: string | number; title: string; description?: string | null };
    const [tests, setTests] = useState<ModuleTest[]>([]);
    const [testTitle, setTestTitle] = useState("");
    const [testDesc, setTestDesc] = useState("");
    const [savingTest, setSavingTest] = useState(false);
    const [showTestModal, setShowTestModal] = useState(false);
    const [testSuccess, setTestSuccess] = useState(false);

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
        e.preventDefault(); setError(null); setSuccess(false);
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
        setSuccess(true);
        setTimeout(() => { setShowLessonModal(false); setSuccess(false); }, 1200);
        dispatch(fetchModules());
    };

    const onAddTest = async (e: React.FormEvent) => {
        e.preventDefault(); setError(null); setTestSuccess(false);
        if (!supabase) { setError("Backend not configured."); return; }
        if (!testTitle.trim()) { setError("Test title is required."); return; }
        setSavingTest(true);
        const { error: err } = await supabase
            .from("module_tests")
            .insert({ module_id: moduleId, title: testTitle, description: testDesc || null });
        setSavingTest(false);
        if (err) { setError(err.message); return; }
        setTestTitle(""); setTestDesc("");
        setTestSuccess(true);
        setTimeout(() => { setShowTestModal(false); setTestSuccess(false); }, 1200);
        const { data } = await supabase
            .from("module_tests")
            .select("id, module_id, title, description")
            .eq("module_id", moduleId);
        setTests((data as ModuleTest[] | null) ?? []);
    };

    return (
        <>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Manage Module</h1>
                        <div className="opacity-70 text-sm">{mod ? mod.title : "Loading…"}</div>
                    </div>
                    <Link className="underline" href={`/admin/courses/${mod?.course_id ?? ""}`}>← Back to course</Link>
                </div>


                <div className="grid md:grid-cols-2 gap-6">
                    <div className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-4">
                        {/* Add Lesson Button above lessons list */}
                        <div className="flex justify-end mb-4">
                            <button
                                className="px-4 py-2 bg-emerald-500 text-white rounded-lg shadow hover:bg-emerald-600 transition text-sm font-semibold"
                                onClick={() => setShowLessonModal(true)}
                                aria-label="Add lesson"
                            >
                                + Add Lesson
                            </button>
                        </div>
                        <div className="font-medium mb-3">Lessons</div>
                        <ul className="space-y-2">
                            {lessons.map((l) => (
                                <li key={String(l.id)} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/10">
                                    <div>
                                        <div className="font-medium">{l.title}</div>
                                        <div className="text-xs opacity-70">ord {l.ordinal ?? "-"}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            className="text-blue-600 hover:text-blue-800"
                                            aria-label="Edit lesson"
                                            onClick={() => {
                                                setEditLessonId(l.id);
                                                setEditTitle(l.title || "");
                                                setEditContent(l.content || "");
                                                setEditVideoUrl(l.video_url || "");
                                                setEditOrdinal(typeof l.ordinal === "number" ? l.ordinal : 1);
                                                setShowLessonEditModal(true);
                                            }}
                                            title="Edit lesson"
                                        >
                                            <FaEdit />
                                        </button>
                                        <Link className="text-sm underline" href={`/admin/lessons/${l.id}`}>Resources »</Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-4">
                        {/* Add Module Test Button above module tests list */}
                        <div className="flex justify-end mb-4">
                            <button
                                className="px-4 py-2 bg-emerald-500 text-white rounded-lg shadow hover:bg-emerald-600 transition text-sm font-semibold"
                                onClick={() => setShowTestModal(true)}
                                aria-label="Add module test"
                            >
                                + Add Module Test
                            </button>
                        </div>
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
                    {/* Modal for Add Module Test */}
                    {showTestModal && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn" tabIndex={-1}>
                            {/* Overlay click closes modal */}
                            <div className="absolute inset-0" onClick={() => { setShowTestModal(false); setError(null); setTestSuccess(false); }} />
                            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-slideUp z-[10000]" role="dialog" aria-modal="true">
                                <button
                                    className="absolute top-4 right-4 text-2xl font-bold text-gray-400 hover:text-gray-700 transition-colors"
                                    onClick={() => { setShowTestModal(false); setError(null); setTestSuccess(false); }}
                                    aria-label="Close"
                                >×</button>
                                <form onSubmit={onAddTest} className="space-y-5">
                                    <div className="font-bold text-2xl text-emerald-600 mb-2">Add Module Test</div>
                                    <div className="space-y-2">
                                        <label htmlFor="test-title" className="text-sm font-medium">Title</label>
                                        <input id="test-title" autoFocus placeholder="e.g., Quiz 1" className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-emerald-400 outline-none transition-all" value={testTitle} onChange={(e) => setTestTitle(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="test-desc" className="text-sm font-medium">Description</label>
                                        <textarea id="test-desc" placeholder="Test description" className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-emerald-400 outline-none transition-all resize-none" value={testDesc} onChange={(e) => setTestDesc(e.target.value)} />
                                    </div>
                                    {error && <div className="text-sm text-red-600 dark:text-red-300">{error}</div>}
                                    {testSuccess && <div className="text-sm text-emerald-600 font-semibold">Module test added successfully!</div>}
                                    <button disabled={savingTest} className="px-4 py-2 rounded-lg text-base font-bold border bg-gradient-to-r from-emerald-500 to-cyan-500 text-white disabled:opacity-60 w-full shadow hover:scale-[1.03] transition-transform">
                                        {savingTest ? (
                                            <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>Saving…</span>
                                        ) : "Create test"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Add Lesson */}
            {showLessonModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn" tabIndex={-1}>
                    {/* Overlay click closes modal */}
                    <div className="absolute inset-0" onClick={() => { setShowLessonModal(false); setError(null); setSuccess(false); }} />
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative animate-slideUp z-[10000]" role="dialog" aria-modal="true">
                        <button
                            className="absolute top-4 right-4 text-2xl font-bold text-gray-400 hover:text-gray-700 transition-colors"
                            onClick={() => { setShowLessonModal(false); setError(null); setSuccess(false); }}
                            aria-label="Close"
                        >×</button>
                        <form onSubmit={onAddLesson} className="space-y-5">
                            <div className="font-bold text-2xl text-emerald-600 mb-2">Add Lesson</div>
                            <div className="space-y-2">
                                <label htmlFor="lesson-title" className="text-sm font-medium">Title</label>
                                <input id="lesson-title" autoFocus placeholder="e.g., Introduction" className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-emerald-400 outline-none transition-all" value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Content</label>
                                <RichTextEditor value={content} onChange={setContent} />
                                <div className="text-xs opacity-70">Rich text will be saved as HTML.</div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="lesson-video" className="text-sm font-medium">Video URL</label>
                                <input id="lesson-video" placeholder="https://..." className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-emerald-400 outline-none transition-all" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="lesson-ordinal" className="text-sm font-medium">Ordinal</label>
                                <input id="lesson-ordinal" type="number" min={1} className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-emerald-400 outline-none transition-all" value={ordinal} onChange={(e) => setOrdinal(Number(e.target.value))} />
                            </div>
                            {error && <div className="text-sm text-red-600 dark:text-red-300">{error}</div>}
                            {success && <div className="text-sm text-emerald-600 font-semibold">Lesson added successfully!</div>}
                            <button disabled={saving} className="px-4 py-2 rounded-lg text-base font-bold border bg-gradient-to-r from-emerald-500 to-cyan-500 text-white disabled:opacity-60 w-full shadow hover:scale-[1.03] transition-transform">
                                {saving ? (
                                    <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>Saving…</span>
                                ) : "Create lesson"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal for Edit Lesson */}
            {showLessonEditModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn" tabIndex={-1}>
                    {/* Overlay click closes modal */}
                    <div className="absolute inset-0" onClick={() => { setShowLessonEditModal(false); setEditError(null); }} />
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-3xl relative animate-slideUp z-[10000]" role="dialog" aria-modal="true">
                        <button
                            className="absolute top-4 right-4 text-2xl font-bold text-gray-400 hover:text-gray-700 transition-colors"
                            onClick={() => { setShowLessonEditModal(false); setEditError(null); }}
                            aria-label="Close"
                        >×</button>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (editLessonId === null || editLessonId === undefined) return;
                                setEditError(null);
                                setEditSaving(true);
                                try {
                                    await dispatch(
                                        updateLesson({
                                            id: editLessonId,
                                            changes: {
                                                title: editTitle.trim(),
                                                content: editContent.trim(),
                                                video_url: editVideoUrl.trim(),
                                                ordinal: editOrdinal,
                                            },
                                        })
                                    ).unwrap();
                                    setShowLessonEditModal(false);
                                    // Refresh modules to reflect updated nested lessons
                                    dispatch(fetchModules());
                                } catch (err) {
                                    const msg = err instanceof Error ? err.message : "Failed to update lesson.";
                                    setEditError(msg);
                                } finally {
                                    setEditSaving(false);
                                }
                            }}
                            className="space-y-5"
                        >
                            <div className="font-bold text-2xl text-emerald-600 mb-2">Edit Lesson</div>
                            <div className="space-y-2">
                                <label htmlFor="edit-lesson-title" className="text-sm font-medium">Title</label>
                                <input id="edit-lesson-title" autoFocus placeholder="Lesson title" className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-emerald-400 outline-none transition-all" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Content</label>
                                <RichTextEditor value={editContent} onChange={setEditContent} />
                                <div className="text-xs opacity-70">Rich text will be saved as HTML.</div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="edit-lesson-video" className="text-sm font-medium">Video URL</label>
                                <input id="edit-lesson-video" placeholder="https://..." className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-emerald-400 outline-none transition-all" value={editVideoUrl} onChange={(e) => setEditVideoUrl(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="edit-lesson-ordinal" className="text-sm font-medium">Ordinal</label>
                                <input id="edit-lesson-ordinal" type="number" min={1} className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-emerald-400 outline-none transition-all" value={editOrdinal} onChange={(e) => setEditOrdinal(Number(e.target.value))} />
                            </div>
                            {editError && <div className="text-sm text-red-600 dark:text-red-300">{editError}</div>}
                            <button disabled={editSaving} className="px-4 py-2 rounded-lg text-base font-bold border bg-gradient-to-r from-emerald-500 to-cyan-500 text-white disabled:opacity-60 w-full shadow hover:scale-[1.03] transition-transform">
                                {editSaving ? (
                                    <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>Saving…</span>
                                ) : "Save changes"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Animations */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(40px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .animate-fadeIn { animation: fadeIn 0.3s ease; }
                .animate-slideUp { animation: slideUp 0.3s cubic-bezier(.4,2,.3,1); }
            `}</style>
        </>
    );
}
