"use client";

import { useEffect, useMemo, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/supabaseClient";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchLessonResources, updateLessonResource, fetchLessonById, selectLessonById } from "@/features/lessons/lessonsSlice";

type Resource = { id: string | number; lesson_id: string | number; title: string; url?: string | null; resource_type?: string | null };

export default function AdminLesson() {
    const { lessonId } = useParams<{ lessonId: string }>();
    const dispatch = useAppDispatch();
    const lessonsState = useAppSelector((s) => s.lessons);
    const lesson = useAppSelector((s) => selectLessonById({ lessons: s.lessons }, lessonId));
    const resources: Resource[] = useMemo(() => {
        const map = lessonsState.resourcesByLessonId ?? {};
        return (map[String(lessonId)] ?? []) as Resource[];
    }, [lessonsState.resourcesByLessonId, lessonId]);
    const [resourceTitle, setResourceTitle] = useState("");
    const [resourceUrl, setResourceUrl] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [resourceType, setResourceType] = useState<string>("website");
    const [showResourceModal, setShowResourceModal] = useState<boolean>(false);
    // Edit resource state
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [editId, setEditId] = useState<string | number | null>(null);
    const [editTitle, setEditTitle] = useState<string>("");
    const [editUrl, setEditUrl] = useState<string>("");
    const [editType, setEditType] = useState<string>("website");
    const [editSaving, setEditSaving] = useState<boolean>(false);
    const [editError, setEditError] = useState<string | null>(null);

    useEffect(() => {
        if (!lessonId) return;
        dispatch(fetchLessonResources({ lessonId }));
    }, [dispatch, lessonId]);

    useEffect(() => {
        if (!lessonId) return;
        if (!lesson) dispatch(fetchLessonById({ id: lessonId }));
    }, [dispatch, lessonId, lesson]);

    const onAddResource = async (e: React.FormEvent) => {
        e.preventDefault(); setError(null);
        if (!supabase) { setError("Backend not configured."); return; }
        if (!resourceTitle.trim()) { setError("Resource title is required."); return; }
        const { error: err } = await supabase.from("lesson_resources").insert({
            lesson_id: lessonId,
            title: resourceTitle,
            url: resourceUrl || null,
            resource_type: resourceType || null,
        });
        if (err) { setError(err.message); return; }
        setResourceTitle(""); setResourceUrl(""); setResourceType("website"); setShowResourceModal(false);
        dispatch(fetchLessonResources({ lessonId }));
    };


    return (
        <>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Manage Lesson</h1>
                    <Link className="underline" href={lesson ? `/admin/modules/${lesson.module_id}` : "/admin"}>← Back</Link>
                </div>

                <div className="w-full">
                    <div className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-6 shadow-lg w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Lesson Resources</h2>
                            <button
                                type="button"
                                className="px-4 py-2 bg-emerald-500 text-white rounded-lg shadow hover:bg-emerald-600 transition text-sm font-semibold"
                                onClick={() => { setError(null); setShowResourceModal(true); }}
                                aria-label="Add resource"
                            >
                                + Add Resource
                            </button>
                        </div>
                        <div className="text-sm opacity-70 mb-6">Attach website links or YouTube videos to this lesson.</div>
                        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                            {resources.length === 0 ? (
                                <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
                                    No resources yet. Click &quot;Add Resource&quot; to create one.
                                </div>
                            ) : (
                                resources.map(r => (
                                    <div key={String(r.id)} className="flex flex-col justify-between h-full min-w-[340px] max-w-[600px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900 p-8 shadow-lg hover:shadow-2xl transition">
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex w-13 h-13 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 font-bold text-lg text-center">
                                                        {r.resource_type === 'youtube' ? 'YT' : 'WEB'}
                                                    </span>
                                                    <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">{r.title}</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="text-blue-600 hover:text-blue-800"
                                                    aria-label="Edit resource"
                                                    onClick={() => {
                                                        setEditId(r.id);
                                                        setEditTitle(r.title || "");
                                                        setEditUrl(r.url || "");
                                                        setEditType(r.resource_type || "website");
                                                        setEditError(null);
                                                        setShowEditModal(true);
                                                    }}
                                                    title="Edit resource"
                                                >
                                                    <FaEdit />
                                                </button>
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{r.url ? <a className="underline" href={r.url} target="_blank" rel="noopener noreferrer">{r.url}</a> : <span className="italic opacity-60">No URL</span>}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Resource modal */}
                {showResourceModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn" tabIndex={-1}>
                        {/* Overlay click closes modal */}
                        <div className="absolute inset-0" onClick={() => setShowResourceModal(false)} />
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-slideUp z-[10000]" role="dialog" aria-modal="true">
                            <button
                                className="absolute top-4 right-4 text-2xl font-bold text-gray-400 hover:text-gray-700 transition-colors"
                                onClick={() => setShowResourceModal(false)}
                                aria-label="Close"
                            >×</button>
                            <form onSubmit={onAddResource} className="space-y-5">
                                <div className="font-bold text-2xl text-emerald-600 mb-2">Add Lesson Resource</div>
                                <div className="space-y-2">
                                    <label htmlFor="res-title" className="text-sm font-medium">Title</label>
                                    <input id="res-title" autoFocus required placeholder="e.g., What is UI Design?" className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-emerald-400 outline-none transition-all" value={resourceTitle} onChange={(e) => setResourceTitle(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="res-type" className="text-sm font-medium">Type</label>
                                        <select id="res-type" className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-emerald-400 outline-none transition-all" value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
                                            <option value="website">Website</option>
                                            <option value="youtube">YouTube video</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="res-url" className="text-sm font-medium">URL</label>
                                        <input id="res-url" required placeholder={resourceType === 'youtube' ? 'https://youtu.be/...' : 'https://...'} className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-emerald-400 outline-none transition-all" value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} />
                                    </div>
                                </div>
                                {error && <div className="text-sm text-red-600 dark:text-red-300">{error}</div>}
                                <button className="px-4 py-2 rounded-lg text-base font-bold border bg-gradient-to-r from-emerald-500 to-cyan-500 text-white disabled:opacity-60 w-full shadow hover:scale-[1.03] transition-transform">Save resource</button>
                            </form>
                        </div>
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
                    </div>
                )}

                {/* Edit Resource modal */}
                {showEditModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn" tabIndex={-1}>
                        {/* Overlay click closes modal */}
                        <div className="absolute inset-0" onClick={() => setShowEditModal(false)} />
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-slideUp z-[10000]" role="dialog" aria-modal="true">
                            <button
                                className="absolute top-4 right-4 text-2xl font-bold text-gray-400 hover:text-gray-700 transition-colors"
                                onClick={() => setShowEditModal(false)}
                                aria-label="Close"
                            >×</button>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (editId === null || editId === undefined) return;
                                    setEditError(null);
                                    setEditSaving(true);
                                    try {
                                        await dispatch(updateLessonResource({
                                            id: editId,
                                            changes: {
                                                title: editTitle.trim(),
                                                url: editUrl.trim(),
                                                resource_type: editType,
                                            },
                                        })).unwrap();
                                        setShowEditModal(false);
                                    } catch (err) {
                                        const msg = err instanceof Error ? err.message : "Failed to update resource.";
                                        setEditError(msg);
                                    } finally {
                                        setEditSaving(false);
                                    }
                                }}
                                className="space-y-5"
                            >
                                <div className="font-bold text-2xl text-emerald-600 mb-2">Edit Resource</div>
                                <div className="space-y-2">
                                    <label htmlFor="edit-res-title" className="text-sm font-medium">Title</label>
                                    <input id="edit-res-title" autoFocus required placeholder="Resource title" className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-emerald-400 outline-none transition-all" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label htmlFor="edit-res-type" className="text-sm font-medium">Type</label>
                                        <select id="edit-res-type" className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-emerald-400 outline-none transition-all" value={editType} onChange={(e) => setEditType(e.target.value)}>
                                            <option value="website">Website</option>
                                            <option value="youtube">YouTube video</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="edit-res-url" className="text-sm font-medium">URL</label>
                                        <input id="edit-res-url" required placeholder={editType === 'youtube' ? 'https://youtu.be/...' : 'https://...'} className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-emerald-400 outline-none transition-all" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
                                    </div>
                                </div>
                                {editError && <div className="text-sm text-red-600 dark:text-red-300">{editError}</div>}
                                <button disabled={editSaving} className="px-4 py-2 rounded-lg text-base font-bold border bg-gradient-to-r from-emerald-500 to-cyan-500 text-white disabled:opacity-60 w-full shadow hover:scale-[1.03] transition-transform">
                                    {editSaving ? (
                                        <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>Saving…</span>
                                    ) : "Save changes"}
                                </button>
                            </form>
                        </div>
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
                    </div>
                )}
            </div>
        </>
    );
}
