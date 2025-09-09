"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/supabaseClient";

type Resource = { id: string | number; lesson_id: string | number; title: string; url?: string | null; resource_type?: string | null };

export default function AdminLesson() {
    const { lessonId } = useParams<{ lessonId: string }>();

    const [resources, setResources] = useState<Resource[]>([]);
    const [resourceTitle, setResourceTitle] = useState("");
    const [resourceUrl, setResourceUrl] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [resourceType, setResourceType] = useState<string>("website");
    const [showResourceModal, setShowResourceModal] = useState<boolean>(false);

    const load = async () => {
        if (!supabase) return;
        // Load resources for lesson
        const { data: resData } = await supabase
            .from("lesson_resources")
            .select("id, lesson_id, title, url, resource_type, created_at")
            .eq("lesson_id", lessonId);
        setResources((resData as Resource[] | null) ?? []);
        // Only resources are managed here; tests are managed on the module page
    };

    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lessonId]);

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
        load();
    };

    // Module tests are now handled in the Module admin page

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Manage Lesson</h1>
                <Link className="underline" href="/admin">← Back</Link>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="font-medium">Lesson resources</div>
                        <button type="button" onClick={() => { setError(null); setShowResourceModal(true); }} className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-emerald-500 text-white">Add resource</button>
                    </div>
                    <div className="text-sm opacity-70">Attach website links or YouTube videos to this lesson.</div>
                </div>

                <div className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-4">
                    <div className="font-medium mb-2">Resources</div>
                    <ul className="space-y-2">
                        {resources.map(r => (
                            <li key={String(r.id)} className="rounded-xl border px-3 py-2 bg-white/70 dark:bg-white/10">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="font-medium">{r.title}</div>
                                    {r.resource_type && <span className="text-xs rounded-full px-2 py-0.5 bg-black/5 dark:bg-white/10">{r.resource_type}</span>}
                                </div>
                                {r.url && <a className="text-xs underline" href={r.url} target="_blank">{r.url}</a>}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Module tests are displayed in the Module admin page */}
            </div>
            {/* Resource modal */}
            {showResourceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowResourceModal(false)} />
                    <div role="dialog" aria-modal="true" className="relative w-full max-w-lg rounded-2xl border bg-white dark:bg-zinc-900 shadow-2xl p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-lg font-semibold">Add lesson resource</h2>
                                <p className="text-sm opacity-70">Choose type and paste the URL.</p>
                            </div>
                            <button type="button" onClick={() => setShowResourceModal(false)} className="rounded-lg px-2 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10">✕</button>
                        </div>
                        <form onSubmit={onAddResource} className="mt-4 space-y-3">
                            <div>
                                <label htmlFor="res-title" className="text-sm">Title</label>
                                <input id="res-title" required placeholder="e.g., What is UI Design?" className="mt-1 w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20" value={resourceTitle} onChange={(e) => setResourceTitle(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="res-type" className="text-sm">Type</label>
                                    <select id="res-type" className="mt-1 w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20" value={resourceType} onChange={(e) => setResourceType(e.target.value)}>
                                        <option value="website">Website</option>
                                        <option value="youtube">YouTube video</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="res-url" className="text-sm">URL</label>
                                    <input id="res-url" required placeholder={resourceType === 'youtube' ? 'https://youtu.be/...' : 'https://...'} className="mt-1 w-full rounded-lg border px-3 py-2 bg-white/90 dark:bg-black/20" value={resourceUrl} onChange={(e) => setResourceUrl(e.target.value)} />
                                </div>
                            </div>
                            {error && <div className="text-sm text-red-600 dark:text-red-300">{error}</div>}
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowResourceModal(false)} className="px-4 py-2 rounded-lg text-sm border hover:bg-black/5 dark:hover:bg-white/10">Cancel</button>
                                <button className="px-4 py-2 rounded-lg text-sm font-medium border bg-emerald-500 text-white">Save resource</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
