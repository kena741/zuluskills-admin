"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCourses, selectCourses, selectCoursesStatus, selectCoursesError } from "@/features/courses/coursesSlice";
import { supabase } from "@/supabaseClient";

export default function AdminHome() {
    const dispatch = useAppDispatch();
    const courses = useAppSelector(selectCourses);
    const status = useAppSelector(selectCoursesStatus);
    const error = useAppSelector(selectCoursesError);

    useEffect(() => { if (status === "idle") dispatch(fetchCourses()); }, [dispatch, status]);

    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [success, setSuccess] = useState(false);

    const onAddCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveError(null);
        setSuccess(false);
        if (!supabase) { setSaveError("Backend not configured (no Supabase env)."); return; }
        if (!title.trim() || !slug.trim()) { setSaveError("Title and slug are required."); return; }
        setSaving(true);
        const { error: err } = await supabase.from("courses").insert({ title, slug, description: description || null });
        setSaving(false);
        if (err) { setSaveError(err.message); return; }
        setTitle(""); setSlug(""); setDescription("");
        setSuccess(true);
        setTimeout(() => { setShowModal(false); setSuccess(false); }, 1200);
        dispatch(fetchCourses());
    };

    return (
        <>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Admin • Courses</h1>
                    <p className="opacity-70 text-lg">Create and manage courses with ease.</p>
                </div>

                {/* Floating Action Button */}
                <button
                    className="fixed bottom-8 right-8 z-[200] shadow-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:scale-105 transition-transform text-white rounded-full p-5 flex items-center justify-center text-2xl font-bold focus:outline-none focus:ring-4 focus:ring-emerald-300"
                    onClick={() => setShowModal(true)}
                    aria-label="Add course"
                >+
                </button>

                <div className="grid md:grid-cols-1 gap-6">
                    <div className="rounded-2xl border bg-white/70 dark:bg-white/10 backdrop-blur p-6 shadow-md">
                        <div className="font-semibold text-xl mb-4 flex items-center gap-2">
                            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" className="text-emerald-500"><circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1" /><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                            All Courses
                        </div>
                        {status === "loading" && (
                            <div className="flex items-center gap-2 opacity-70 animate-pulse">
                                <svg className="animate-spin h-5 w-5 text-emerald-500" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
                                Loading…
                            </div>
                        )}
                        {status === "failed" && <div className="text-red-600 dark:text-red-300">{error || "Failed to load"}</div>}
                        <ul className="grid sm:grid-cols-2 gap-4">
                            {courses.map(c => (
                                <li key={String(c.id)} className="group flex items-center justify-between gap-3 rounded-xl border px-4 py-3 bg-white/90 dark:bg-white/10 shadow-sm hover:shadow-lg transition-shadow cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow">
                                            {c.title ? c.title[0].toUpperCase() : "?"}
                                        </div>
                                        <div>
                                            <div className="font-semibold group-hover:text-emerald-600 transition-colors">{c.title}</div>
                                            <div className="text-xs opacity-70">{c.slug}</div>
                                        </div>
                                    </div>
                                    <Link className="text-sm underline text-emerald-500 group-hover:text-cyan-500 transition-colors" href={`/admin/courses/${c.id}`}>Manage »</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Modal for Add Course */}
            {showModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn" tabIndex={-1}>
                    {/* Overlay click closes modal */}
                    <div className="absolute inset-0" onClick={() => { setShowModal(false); setSaveError(null); setSuccess(false); }} />
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-slideUp z-[10000]" role="dialog" aria-modal="true">
                        <button
                            className="absolute top-4 right-4 text-2xl font-bold text-gray-400 hover:text-gray-700 transition-colors"
                            onClick={() => { setShowModal(false); setSaveError(null); setSuccess(false); }}
                            aria-label="Close"
                        >×</button>
                        <form onSubmit={onAddCourse} className="space-y-5">
                            <div className="font-bold text-2xl text-emerald-600 mb-2">Add Course</div>
                            <div className="space-y-2">
                                <label htmlFor="course-title" className="text-sm font-medium">Title</label>
                                <input id="course-title" autoFocus placeholder="e.g., UI/UX Design" className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-emerald-400 outline-none transition-all" value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="course-slug" className="text-sm font-medium">Slug</label>
                                <input id="course-slug" placeholder="ui-ux-design" className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-emerald-400 outline-none transition-all" value={slug} onChange={(e) => setSlug(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="course-description" className="text-sm font-medium">Description</label>
                                <textarea id="course-description" placeholder="Short summary" className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-emerald-400 outline-none transition-all resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>
                            {saveError && <div className="text-sm text-red-600 dark:text-red-300">{saveError}</div>}
                            {success && <div className="text-sm text-emerald-600 font-semibold">Course added successfully!</div>}
                            <button disabled={saving} className="px-4 py-2 rounded-lg text-base font-bold border bg-gradient-to-r from-emerald-500 to-cyan-500 text-white disabled:opacity-60 w-full shadow hover:scale-[1.03] transition-transform">
                                {saving ? (
                                    <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>Saving…</span>
                                ) : "Create course"}
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
