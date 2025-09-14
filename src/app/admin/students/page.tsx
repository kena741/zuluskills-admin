"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchStudents, selectStudents, selectStudentsError, selectStudentsStatus } from "@/features/students/studentsSlice";

export default function StudentsPage() {
    const dispatch = useAppDispatch();
    const students = useAppSelector(selectStudents);
    const status = useAppSelector(selectStudentsStatus);
    const error = useAppSelector(selectStudentsError);

    useEffect(() => {
        if (status === "idle") dispatch(fetchStudents());
    }, [dispatch, status]);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Admin • Students</h1>
                <p className="opacity-70 text-lg">View and manage students.</p>
            </div>

            <div className="rounded-2xl border bg-white/70 dark:bg-white/10 backdrop-blur p-6 shadow-md">
                <div className="font-semibold text-xl mb-4 flex items-center gap-2">
                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24" className="text-emerald-500"><circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1" /><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    All Students
                </div>

                {status === "loading" && (
                    <div className="flex items-center gap-2 opacity-70 animate-pulse">
                        <svg className="animate-spin h-5 w-5 text-emerald-500" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
                        Loading…
                    </div>
                )}
                {status === "failed" && (
                    <div className="text-red-600 dark:text-red-300">{error || "Failed to load students"}</div>
                )}

                {status === "succeeded" && students.length === 0 && (
                    <div className="opacity-70">No students found.</div>
                )}

                {students.length > 0 && (
                    <ul className="divide-y divide-black/10 dark:divide-white/10">
                        {students.map((s) => {
                            const name = s.display_name || [s.first_name, s.last_name].filter(Boolean).join(" ") || "(No name)";
                            return (
                                <li key={s.id} className="py-3 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-cyan-400 text-white flex items-center justify-center font-bold">
                                            {s.avatar_url ? (
                                                <Image src={s.avatar_url} alt={name} fill sizes="40px" className="object-cover" />
                                            ) : (
                                                <span>{name[0]?.toUpperCase() || "?"}</span>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-medium truncate">
                                                <Link href={`/admin/students/${s.id}`} className="underline underline-offset-2 text-emerald-600 hover:text-cyan-600">{name}</Link>
                                            </div>
                                            <div className="text-sm opacity-70 truncate">{s.email || "—"}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs opacity-70 whitespace-nowrap">
                                        {s.created_at ? new Date(s.created_at).toLocaleString() : ""}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
