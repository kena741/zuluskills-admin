"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCourses, selectCourses, selectCoursesStatus, selectCoursesError } from "@/features/courses/coursesSlice";
import { supabase } from "@/supabaseClient";

function slugify(input: string) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

export default function AdminHome() {
    const dispatch = useAppDispatch();
    const courses = useAppSelector(selectCourses);
    const status = useAppSelector(selectCoursesStatus);
    const error = useAppSelector(selectCoursesError);

    useEffect(() => {
        if (status === "idle") dispatch(fetchCourses());
    }, [dispatch, status]);

    // Add Course modal state
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [success, setSuccess] = useState(false);

    // Search/sort
    const [query, setQuery] = useState("");
    const [sortBy, setSortBy] = useState<"latest" | "title">("latest");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let next = courses;
        if (q) {
            next = courses.filter((c) =>
                [c.title, c.slug, c.description ?? ""].some((v) => `${v}`.toLowerCase().includes(q))
            );
        }
        if (sortBy === "title") {
            return [...next].sort((a, b) => a.title.localeCompare(b.title));
        }
        // default latest by created_at desc if available, else by title desc
        return [...next].sort((a, b) => {
            const aT = a.created_at ? Date.parse(a.created_at) : 0;
            const bT = b.created_at ? Date.parse(b.created_at) : 0;
            if (aT !== bT) return bT - aT;
            return b.title.localeCompare(a.title);
        });
    }, [courses, query, sortBy]);

    const onAddCourse = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveError(null);
        setSuccess(false);
        if (!supabase) {
            setSaveError("Backend not configured (no Supabase env).");
            return;
        }
        const finalSlug = (slug || slugify(title)).trim();
        if (!title.trim() || !finalSlug) {
            setSaveError("Title and slug are required.");
            return;
        }
        setSaving(true);
        const { error: err } = await supabase
            .from("courses")
            .insert({ title: title.trim(), slug: finalSlug, description: description || null });
        setSaving(false);
        if (err) {
            setSaveError(err.message);
            return;
        }
        setTitle("");
        setSlug("");
        setDescription("");
        setSuccess(true);
        setTimeout(() => {
            setShowModal(false);
            setSuccess(false);
        }, 1000);
        dispatch(fetchCourses());
    };

    // Auto-suggest slug from title if slug is empty
    useEffect(() => {
        if (!slug.trim()) setSlug(slugify(title));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [title]);

    return (
        <>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight">Admin • Courses</h1>
                        <p className="opacity-70">Create and manage courses with ease.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search courses…"
                                className="w-56 md:w-72 rounded-xl border bg-white/70 dark:bg-white/10 backdrop-blur px-4 py-2 pr-10 focus:ring-2 focus:ring-emerald-400 outline-none"
                                aria-label="Search courses"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-60">⌘K</span>
                        </div>
                                                <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as "latest" | "title")}
                                                    className="rounded-xl border bg-white/70 dark:bg-white/10 backdrop-blur px-3 py-2 focus:ring-2 focus:ring-sky-400 outline-none"
                            aria-label="Sort courses"
                        >
                            <option value="latest">Latest</option>
                            <option value="title">Title (A–Z)</option>
                        </select>
                                                <button
                                                    onClick={() => setShowModal(true)}
                                                    className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white bg-sky-600 hover:bg-indigo-600 shadow hover:scale-[1.02] transition-transform"
                        >
                            <span className="text-lg">＋</span> New course
                        </button>
                    </div>
                </div>

                {/* Floating Action Button */}
                                <button
                                    className="fixed bottom-8 right-8 z-[200] shadow-lg bg-sky-600 hover:bg-indigo-600 hover:scale-105 transition-transform text-white rounded-full p-5 flex items-center justify-center text-2xl font-bold focus:outline-none focus:ring-4 focus:ring-sky-300 md:hidden"
                    onClick={() => setShowModal(true)}
                    aria-label="Add course"
                >
                    +
                </button>

                <div className="rounded-3xl border bg-white/60 dark:bg-white/10 backdrop-blur p-6 shadow-md">
                    <div className="font-semibold text-xl mb-4">All Courses</div>

                    {status === "loading" && (
                        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
                                            {Array.from({ length: 6 }).map((_, i) => (
                                                <li key={i} className="rounded-2xl border bg-white/60 dark:bg-white/10 backdrop-blur p-4 shadow animate-pulse h-36" />
                            ))}
                        </ul>
                    )}

                    {status === "failed" && (
                        <div className="text-red-600 dark:text-red-300">{error || "Failed to load"}</div>
                    )}

                    {status === "succeeded" && filtered.length === 0 && (
                        <div className="text-center py-16">
                                                            <div className="mx-auto w-16 h-16 rounded-full bg-sky-400 opacity-80 mb-4" />
                            <div className="text-lg font-semibold">No courses found</div>
                            <div className="opacity-70 mb-6">Try adjusting your search or create a new course.</div>
                            <button
                                onClick={() => setShowModal(true)}
                                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white bg-sky-600 hover:bg-indigo-600 shadow hover:scale-[1.02] transition-transform"
                            >
                                Create your first course
                            </button>
                        </div>
                    )}

                    {status !== "loading" && filtered.length > 0 && (
                        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((c) => (
                                                                                <li key={String(c.id)} className="group">
                                                                                    <div className="rounded-2xl border bg-white/80 dark:bg-white/10 backdrop-blur p-4 shadow-sm group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-0.5 h-40 overflow-hidden">
                                            <div className="flex items-start gap-3">
                                                                                <div className="w-11 h-11 rounded-xl bg-sky-600 flex items-center justify-center text-white font-bold text-lg shadow">
                                                    {c.title ? c.title[0].toUpperCase() : "?"}
                                                </div>
                                                <div className="min-w-0">
                                                                                                    <div className="font-semibold truncate group-hover:text-indigo-600 transition-colors">
                                                        {c.title}
                                                    </div>
                                                                                                    <div className="text-xs opacity-70 truncate">/{c.slug}</div>
                                                </div>
                                            </div>
                                                                                            {c.description && (
                                                                                                <p className="mt-3 text-sm opacity-80 line-clamp-2">{c.description}</p>
                                            )}
                                            <div className="mt-4 flex items-center justify-between">
                                                <div className="text-xs opacity-60">{c.created_at ? new Date(c.created_at).toLocaleDateString() : ""}</div>
                                                <Link
                                                                    className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-sky-600"
                                                    href={`/admin/courses/${c.id}`}
                                                >
                                                    Manage <span aria-hidden>»</span>
                                                </Link>
                                            </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Modal for Add Course */}
            {showModal && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn"
                    tabIndex={-1}
                >
                    {/* Overlay click closes modal */}
                    <div
                        className="absolute inset-0"
                        onClick={() => {
                            setShowModal(false);
                            setSaveError(null);
                            setSuccess(false);
                        }}
                    />
                    <div
                        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-slideUp z-[10000]"
                        role="dialog"
                        aria-modal="true"
                    >
                                    <button
                            className="absolute top-4 right-4 text-2xl font-bold text-gray-400 hover:text-gray-700 transition-colors"
                            onClick={() => {
                                setShowModal(false);
                                setSaveError(null);
                                setSuccess(false);
                            }}
                            aria-label="Close"
                        >
                            ×
                        </button>
                        <form onSubmit={onAddCourse} className="space-y-5">
                                          <div className="font-bold text-2xl text-sky-700 dark:text-sky-400 mb-2">Add Course</div>
                            <div className="space-y-2">
                                <label htmlFor="course-title" className="text-sm font-medium">
                                    Title
                                </label>
                                <input
                                    id="course-title"
                                    autoFocus
                                    placeholder="e.g., UI/UX Design"
                                                className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-sky-400 outline-none transition-all"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="course-slug" className="text-sm font-medium">
                                    Slug
                                </label>
                                <input
                                    id="course-slug"
                                    placeholder="ui-ux-design"
                                                className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-sky-400 outline-none transition-all"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="course-description" className="text-sm font-medium">
                                    Description
                                </label>
                                <textarea
                                    id="course-description"
                                    placeholder="Short summary"
                                                className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20 focus:ring-2 focus:ring-sky-400 outline-none transition-all resize-none"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                            {saveError && (
                                <div className="text-sm text-red-600 dark:text-red-300">{saveError}</div>
                            )}
                            {success && (
                                            <div className="text-sm text-sky-600 font-semibold">
                                    Course added successfully!
                                </div>
                            )}
                            <button
                                disabled={saving}
                                            className="px-4 py-2 rounded-lg text-base font-bold border bg-gradient-to-r from-sky-500 to-indigo-500 text-white disabled:opacity-60 w-full shadow hover:scale-[1.03] transition-transform"
                            >
                                {saving ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        </svg>
                                        Saving…
                                    </span>
                                ) : (
                                    "Create course"
                                )}
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
