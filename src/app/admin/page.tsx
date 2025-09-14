"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/supabaseClient";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    AreaChart,
    Area,
} from "recharts";

type CourseRow = { id: string | number; title: string };
type ModuleRow = { id: string | number; course_id: string | number };
type LessonRow = { id: string | number; module_id: string | number };

export default function AdminHome() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [totalStudents, setTotalStudents] = useState<number | null>(null);
    const [totalCourses, setTotalCourses] = useState<number | null>(null);
    const [totalLessons, setTotalLessons] = useState<number | null>(null);
    const [lessonCompletions7d, setLessonCompletions7d] = useState<number | null>(null);

    const [topCoursesByLessons, setTopCoursesByLessons] = useState<Array<{ title: string; lessons: number }>>([]);
    const [completionsPerDay, setCompletionsPerDay] = useState<Array<{ date: string; count: number }>>([]);

    const fmt = useCallback((n: number | null | undefined) => {
        if (n === null || typeof n === "undefined") return "—";
        return new Intl.NumberFormat().format(n);
    }, []);

    const refresh = useCallback(async () => {
        if (!supabase) {
            setError("Supabase not configured (missing env vars)");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
            const sevenDaysAgoISO = sevenDaysAgo.toISOString();

            // Counts using HEAD requests for efficiency
            const [studentsCnt, coursesCnt, lessonsCnt, completionsCnt] = await Promise.all([
                supabase.from("students").select("id", { count: "exact", head: true }),
                supabase.from("courses").select("id", { count: "exact", head: true }),
                supabase.from("lessons").select("id", { count: "exact", head: true }),
                supabase
                    .from("user_lesson_progress")
                    .select("completed_at", { count: "exact", head: true })
                    .eq("completed", true)
                    .gte("completed_at", sevenDaysAgoISO),
            ]);

            setTotalStudents(studentsCnt.count ?? 0);
            setTotalCourses(coursesCnt.count ?? 0);
            setTotalLessons(lessonsCnt.count ?? 0);
            setLessonCompletions7d(completionsCnt.count ?? 0);

            // Top courses by lesson count
            const { data: courseRows, error: cErr } = await supabase
                .from("courses")
                .select("id, title");
            if (cErr) throw new Error(cErr.message);
            const { data: moduleRows, error: mErr } = await supabase
                .from("modules")
                .select("id, course_id");
            if (mErr) throw new Error(mErr.message);
            const { data: lessonRows, error: lErr } = await supabase
                .from("lessons")
                .select("id, module_id");
            if (lErr) throw new Error(lErr.message);

            const courses = (courseRows ?? []) as CourseRow[];
            const modules = (moduleRows ?? []) as ModuleRow[];
            const lessons = (lessonRows ?? []) as LessonRow[];

            const modsByCourse = new Map<string, string[]>();
            for (const m of modules) {
                const key = String(m.course_id);
                const arr = modsByCourse.get(key) ?? [];
                arr.push(String(m.id));
                modsByCourse.set(key, arr);
            }
            const lessonCountByModule = new Map<string, number>();
            for (const l of lessons) {
                const key = String(l.module_id);
                lessonCountByModule.set(key, (lessonCountByModule.get(key) ?? 0) + 1);
            }
            const rows: Array<{ title: string; lessons: number }> = courses.map((c) => {
                const mids = modsByCourse.get(String(c.id)) ?? [];
                const count = mids.reduce((acc, mid) => acc + (lessonCountByModule.get(mid) ?? 0), 0);
                return { title: c.title, lessons: count };
            });
            rows.sort((a, b) => b.lessons - a.lessons);
            setTopCoursesByLessons(rows.slice(0, 5));

            // Completions per day (last 7 days)
            const { data: compsRows, error: compsErr } = await supabase
                .from("user_lesson_progress")
                .select("completed_at")
                .eq("completed", true)
                .gte("completed_at", sevenDaysAgoISO);
            if (compsErr) throw new Error(compsErr.message);
            const counts = new Map<string, number>();
            for (let i = 0; i < 7; i++) {
                const d = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
                const key = d.toISOString().slice(0, 10);
                counts.set(key, 0);
            }
            for (const row of compsRows ?? []) {
                const ts = row?.completed_at as string | null;
                if (!ts) continue;
                const key = ts.slice(0, 10);
                if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
            }
            setCompletionsPerDay(Array.from(counts.entries()).map(([date, count]) => ({ date, count })));
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to load analytics";
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const bigNumberClasses = "text-3xl md:text-4xl font-bold";

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Dashboard • Analytics</h1>
                    <p className="opacity-70">Overview of platform health and engagement.</p>
                </div>
                <button
                    onClick={refresh}
                    disabled={loading}
                    className="px-3 py-2 rounded-lg text-sm font-semibold border bg-gradient-to-r from-emerald-500 to-cyan-500 text-white disabled:opacity-60 shadow"
                >
                    {loading ? "Refreshing…" : "Refresh"}
                </button>
            </div>

            {error && (
                <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-4 text-red-700 dark:text-red-200">
                    {error}
                </div>
            )}

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border bg-white/60 dark:bg-white/10 backdrop-blur p-5 shadow">
                    <div className="text-xs opacity-70 mb-1">Students</div>
                    <div className={bigNumberClasses}>{fmt(totalStudents)}</div>
                </div>
                <div className="rounded-2xl border bg-white/60 dark:bg-white/10 backdrop-blur p-5 shadow">
                    <div className="text-xs opacity-70 mb-1">Courses</div>
                    <div className={bigNumberClasses}>{fmt(totalCourses)}</div>
                </div>
                <div className="rounded-2xl border bg-white/60 dark:bg-white/10 backdrop-blur p-5 shadow">
                    <div className="text-xs opacity-70 mb-1">Lessons</div>
                    <div className={bigNumberClasses}>{fmt(totalLessons)}</div>
                </div>
                <div className="rounded-2xl border bg-white/60 dark:bg-white/10 backdrop-blur p-5 shadow">
                    <div className="text-xs opacity-70 mb-1">Lesson completions (7d)</div>
                    <div className={bigNumberClasses}>{fmt(lessonCompletions7d)}</div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border bg-white/60 dark:bg-white/10 backdrop-blur p-5 shadow">
                    <div className="font-semibold mb-3">Top courses by lesson count</div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topCoursesByLessons} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="title" tick={{ fontSize: 12 }} hide={false} interval={0} angle={-10} height={40} />
                                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} />
                                <Bar dataKey="lessons" fill="#10b981" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="rounded-2xl border bg-white/60 dark:bg-white/10 backdrop-blur p-5 shadow">
                    <div className="font-semibold mb-3">Lesson completions (7 days)</div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={completionsPerDay} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                <Tooltip cursor={{ stroke: "#06b6d4", strokeWidth: 1 }} />
                                <Area type="monotone" dataKey="count" stroke="#06b6d4" fillOpacity={1} fill="url(#grad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
