"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCourseById, selectCourseById } from "@/features/courses/coursesSlice";
import type { RootState } from "@/store/store";
import { fetchModules, selectModules } from "@/features/modules/modulesSlice";
import { supabase } from "@/supabaseClient";

export default function AdminCourse() {
    const params = useParams<{ courseId: string }>();
    const dispatch = useAppDispatch();

    useEffect(() => {
        if (!params?.courseId) return;
        dispatch(fetchCourseById({ id: params.courseId }));
        dispatch(fetchModules({ courseId: params.courseId }));
    }, [dispatch, params.courseId]);

    const course = useAppSelector((s: RootState) => selectCourseById({ courses: s.courses }, params.courseId));
    const modules = useAppSelector(selectModules).filter(m => `${m.course_id}` === `${params.courseId}`);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [ordinal, setOrdinal] = useState<number>(modules.length + 1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { setOrdinal(modules.length + 1); }, [modules.length]);

    const onAddModule = async (e: React.FormEvent) => {
        e.preventDefault(); setError(null);
        if (!supabase) { setError("Backend not configured."); return; }
        if (!title.trim()) { setError("Title is required."); return; }
        setSaving(true);
        const { error: err } = await supabase.from("modules").insert({ course_id: params.courseId, title, description: description || null, ordinal });
        setSaving(false);
        if (err) { setError(err.message); return; }
        setTitle(""); setDescription("");
        dispatch(fetchModules({ courseId: params.courseId }));
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Manage Course</h1>
                    <div className="opacity-70 text-sm">{course ? `${course.title} (${course.slug})` : "Loading…"}</div>
                </div>
                <Link className="underline" href="/admin">← Back</Link>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <form onSubmit={onAddModule} className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-4 space-y-3">
                    <div className="font-medium">Add module</div>
                    <div>
                        <label htmlFor="module-title" className="text-sm">Title</label>
                        <input id="module-title" className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="module-description" className="text-sm">Description</label>
                        <textarea id="module-description" className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="module-ordinal" className="text-sm">Ordinal</label>
                        <input id="module-ordinal" type="number" min={1} className="w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20" value={ordinal} onChange={(e) => setOrdinal(Number(e.target.value))} />
                    </div>
                    {error && <div className="text-sm text-red-600 dark:text-red-300">{error}</div>}
                    <button disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium border bg-emerald-500 text-white disabled:opacity-60">{saving ? "Saving…" : "Create module"}</button>
                </form>

                <div className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-4">
                    <div className="font-medium mb-3">Modules</div>
                    <ul className="space-y-2">
                        {modules.map(m => (
                            <li key={String(m.id)} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/10">
                                <div>
                                    <div className="font-medium">{m.title}</div>
                                    <div className="text-xs opacity-70">ord {m.ordinal ?? "-"}</div>
                                </div>
                                <Link className="text-sm underline" href={`/admin/modules/${m.id}`}>Lessons »</Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
