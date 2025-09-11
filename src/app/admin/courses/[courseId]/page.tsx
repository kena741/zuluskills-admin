"use client";

import { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchCourseById, selectCourseById, updateCourse } from "@/features/courses/coursesSlice";
import type { RootState } from "@/store/store";
import { fetchModules, selectModules, updateModule } from "@/features/modules/modulesSlice";
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
    const [showAddModuleModal, setShowAddModuleModal] = useState(false);
    const [showModuleEditModal, setShowModuleEditModal] = useState(false);
    const [moduleEditId, setModuleEditId] = useState<number | string | null>(null);
    const [moduleEditTitle, setModuleEditTitle] = useState("");
    const [moduleEditDescription, setModuleEditDescription] = useState("");
    const [moduleEditOrdinal, setModuleEditOrdinal] = useState(1);
    const [moduleEditSaving, setModuleEditSaving] = useState(false);
    const [moduleEditError, setModuleEditError] = useState<string | null>(null);

    useEffect(() => { setOrdinal(modules.length + 1); }, [modules.length]);

    // Edit modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    useEffect(() => {
        if (course) {
            setEditTitle(course.title || "");
            setEditDescription(course.description || "");
        }
    }, [course]);

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!params?.courseId) return;
        setEditError(null);
        setEditSaving(true);
        try {
            await dispatch(
                updateCourse({
                    id: params.courseId,
                    changes: {
                        title: editTitle.trim(),
                        description: editDescription.trim(),
                    },
                })
            ).unwrap();
            setShowEditModal(false);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Failed to update course.";
            setEditError(msg);
        } finally {
            setEditSaving(false);
        }
    };

    const onAddModule = async (e: React.FormEvent) => {
        e.preventDefault(); setError(null);
        if (!supabase) { setError("Backend not configured."); return; }
        if (!title.trim()) { setError("Title is required."); return; }
        setSaving(true);
        const { error: err } = await supabase.from("modules").insert({ course_id: params.courseId, title, description: description || null, ordinal });
        setSaving(false);
        if (err) { setError(err.message); return; }
        setTitle(""); setDescription("");
        setShowAddModuleModal(false);
        dispatch(fetchModules({ courseId: params.courseId }));
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                        Manage Course
                        <button
                            type="button"
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            onClick={() => setShowEditModal(true)}
                            aria-label="Edit course"
                            disabled={!course}
                        >
                            <FaEdit />
                        </button>
                    </h1>
                    <div className="opacity-70 text-sm">{course ? `${course.title} (${course.slug})` : "Loading…"}</div>
                </div>
                <Link className="underline" href="/admin/courses">← Back</Link>
            </div>

            {/* Edit Course Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Edit Course Info</h2>
                        <form onSubmit={handleEditSubmit}>
                            <div className="mb-4">
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Title</label>
                                <input
                                    type="text"
                                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    required
                                    placeholder="Course title"
                                    title="Course title"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Description</label>
                                <textarea
                                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                                    value={editDescription}
                                    onChange={e => setEditDescription(e.target.value)}
                                    required
                                    placeholder="Course description"
                                    title="Course description"
                                />
                            </div>
                            {editError && (
                                <div className="mb-3 text-sm text-red-600 dark:text-red-400">{editError}</div>
                            )}
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
                                    onClick={() => setShowEditModal(false)}
                                >Cancel</button>
                                <button
                                    type="submit"
                                    disabled={editSaving}
                                    className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded disabled:opacity-60 disabled:cursor-not-allowed"
                                >{editSaving ? "Saving…" : "Save"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="w-full">
                <div className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-6 shadow-lg w-full">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Modules</h2>
                        <button
                            type="button"
                            className="px-4 py-2 bg-emerald-500 text-white rounded-lg shadow hover:bg-emerald-600 transition text-sm font-semibold"
                            onClick={() => setShowAddModuleModal(true)}
                        >
                            + Add Module
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                        {modules.length === 0 ? (
                            <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
                                No modules yet. Click &quot;Add Module&quot; to create one.
                            </div>
                        ) : (
                            modules.map(m => (
                                <div key={String(m.id)} className="flex flex-col justify-between h-full min-w-[320px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900 p-6 shadow hover:shadow-xl transition">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-lg text-center">
                                                {m.ordinal ?? "-"}
                                            </span>
                                            <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">{m.title}</span>
                                            <button
                                                type="button"
                                                className="ml-2 text-blue-500 hover:text-blue-700"
                                                aria-label="Edit module"
                                                onClick={() => {
                                                    setModuleEditId(m.id);
                                                    setModuleEditTitle(m.title || "");
                                                    setModuleEditDescription(m.description || "");
                                                    setModuleEditOrdinal(m.ordinal ?? 1);
                                                    setShowModuleEditModal(true);
                                                }}
                                            >
                                                <FaEdit />
                                            </button>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{m.description || <span className="italic opacity-60">No description</span>}</div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Link className="px-3 py-1 bg-blue-600 dark:bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-800 transition" href={`/admin/modules/${m.id}`}>View Lessons</Link>
                                    </div>
                                </div>

                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Module Modal */}
            {/* Add Module Modal */}
            {showAddModuleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Add Module</h2>
                        <form onSubmit={onAddModule}>
                            <div className="mb-4">
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Title</label>
                                <input
                                    type="text"
                                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    required
                                    placeholder="Module title"
                                    title="Module title"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Description</label>
                                <textarea
                                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Module description (optional)"
                                    title="Module description"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Ordinal</label>
                                <input
                                    type="number"
                                    min={1}
                                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                                    value={ordinal}
                                    onChange={e => setOrdinal(Number(e.target.value))}
                                    required
                                    placeholder="Module order"
                                    title="Module order"
                                />
                            </div>
                            {error && (
                                <div className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</div>
                            )}
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
                                    onClick={() => setShowAddModuleModal(false)}
                                >Cancel</button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded disabled:opacity-60 disabled:cursor-not-allowed"
                                >{saving ? "Adding…" : "Add"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModuleEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
                    <div className="bg-white dark:bg-gray-900 p-6 rounded shadow-lg w-full max-w-md border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">Edit Module</h2>
                        <form onSubmit={async e => {
                            e.preventDefault();
                            if (moduleEditId === null || moduleEditId === undefined) return;
                            setModuleEditError(null);
                            setModuleEditSaving(true);
                            try {
                                await dispatch(
                                    updateModule({
                                        id: moduleEditId,
                                        changes: {
                                            title: moduleEditTitle.trim(),
                                            description: moduleEditDescription.trim(),
                                            ordinal: moduleEditOrdinal,
                                        },
                                    })
                                ).unwrap();
                                setShowModuleEditModal(false);
                            } catch (err) {
                                const msg = err instanceof Error ? err.message : "Failed to update module.";
                                setModuleEditError(msg);
                            } finally {
                                setModuleEditSaving(false);
                            }
                        }}>
                            <div className="mb-4">
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Title</label>
                                <input
                                    type="text"
                                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                                    value={moduleEditTitle}
                                    onChange={e => setModuleEditTitle(e.target.value)}
                                    required
                                    placeholder="Module title"
                                    title="Module title"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Description</label>
                                <textarea
                                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                                    value={moduleEditDescription}
                                    onChange={e => setModuleEditDescription(e.target.value)}
                                    required
                                    placeholder="Module description"
                                    title="Module description"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block mb-1 font-medium text-gray-700 dark:text-gray-300">Ordinal</label>
                                <input
                                    type="number"
                                    min={1}
                                    className="w-full border px-3 py-2 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
                                    value={moduleEditOrdinal}
                                    onChange={e => setModuleEditOrdinal(Number(e.target.value))}
                                    required
                                    placeholder="Module order"
                                    title="Module order"
                                />
                            </div>
                            {moduleEditError && (
                                <div className="mb-3 text-sm text-red-600 dark:text-red-400">{moduleEditError}</div>
                            )}
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded"
                                    onClick={() => setShowModuleEditModal(false)}
                                >Cancel</button>
                                <button
                                    type="submit"
                                    disabled={moduleEditSaving}
                                    className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded disabled:opacity-60 disabled:cursor-not-allowed"
                                >{moduleEditSaving ? "Saving…" : "Save"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
