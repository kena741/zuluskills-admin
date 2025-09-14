"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { supabase } from "@/supabaseClient";
import {
  fetchStudentById,
  fetchStudentCourseProgress,
  fetchStudentLessonProgress,
  selectStudentById,
  selectStudentCourseProgress,
  selectStudentLessonProgress,
  selectStudentsStatus,
  selectStudentsError,
  selectStudentCourseProgressStatus,
  selectStudentCourseProgressError,
} from "@/features/students/studentsSlice";

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const dispatch = useAppDispatch();

  const studentsStatus = useAppSelector(selectStudentsStatus);
  const studentsError = useAppSelector(selectStudentsError);
  const student = useAppSelector((s) => selectStudentById({ students: s.students }, String(studentId)));

  const courseProgress = useAppSelector((s) => selectStudentCourseProgress({ students: s.students }, String(studentId)));
  const courseProgressStatus = useAppSelector(selectStudentCourseProgressStatus);
  const courseProgressError = useAppSelector(selectStudentCourseProgressError);

  const lessonProgress = useAppSelector((s) => selectStudentLessonProgress({ students: s.students }, String(studentId)));

  // Local analytics state
  type CourseDetail = {
    id: string;
    title: string;
    totalLessons: number;
    completedLessons: number;
    inProgressLessons: number;
    percent: number;
    status: "in-progress" | "completed";
    completedLessonItems: { id: string; title: string }[];
    inProgressLessonItems: { id: string; title: string }[];
  };
  type CourseRow = { id: string | number; title: string };
  type ModuleRow = { id: string | number; course_id: string | number };
  type LessonRow = { id: string | number; module_id: string | number; title?: string | null };
  const [courseDetails, setCourseDetails] = useState<CourseDetail[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!studentId) return;
    if (!student) dispatch(fetchStudentById({ id: String(studentId) }));
  }, [dispatch, studentId, student]);

  useEffect(() => {
    if (!studentId) return;
    // Fetch progress whenever we land here
    dispatch(fetchStudentCourseProgress({ studentId: String(studentId) }));
    dispatch(fetchStudentLessonProgress({ studentId: String(studentId) }));
  }, [dispatch, studentId]);

  // Compute analytics: fetch course titles, modules, lessons => per course totals and completion
  useEffect(() => {
    const doAnalytics = async () => {
      const courseIds = Object.keys(courseProgress || {});
      if (!studentId || courseIds.length === 0) { setCourseDetails([]); return; }
      if (!supabase) { setAnalyticsError("Backend not configured (no Supabase env)." ); return; }
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      try {
        // 1) Load courses (titles)
        const { data: coursesData, error: coursesErr } = await supabase
          .from("courses")
          .select("id, title")
          .in("id", courseIds);
        if (coursesErr) throw new Error(coursesErr.message);
        const titleById = new Map<string, string>(
          ((coursesData ?? []) as CourseRow[]).map((c) => [String(c.id), c.title])
        );

        // 2) Load modules for those courses
        const { data: modulesData, error: modulesErr } = await supabase
          .from("modules")
          .select("id, course_id")
          .in("course_id", courseIds);
        if (modulesErr) throw new Error(modulesErr.message);
        const moduleIds = ((modulesData ?? []) as ModuleRow[]).map((m) => String(m.id));
        const modulesByCourse = new Map<string, string[]>();
        for (const m of ((modulesData ?? []) as ModuleRow[])) {
          const cid = String(m.course_id);
          const arr = modulesByCourse.get(cid) ?? [];
          arr.push(String(m.id));
          modulesByCourse.set(cid, arr);
        }

        // 3) Load lessons for all modules
        let lessonsData: LessonRow[] = [];
        if (moduleIds.length > 0) {
          const { data, error } = await supabase
            .from("lessons")
            .select("id, module_id, title")
            .in("module_id", moduleIds);
          if (error) throw new Error(error.message);
          lessonsData = (data ?? []) as LessonRow[];
        }
        const lessonsByModule = new Map<string, string[]>();
        const lessonTitleById = new Map<string, string>();
        for (const l of lessonsData) {
          const mid = String(l.module_id);
          const arr = lessonsByModule.get(mid) ?? [];
          arr.push(String(l.id));
          lessonsByModule.set(mid, arr);
          if (l.title) lessonTitleById.set(String(l.id), l.title);
        }

        // 4) Build per-course totals and completed counts
        const details: CourseDetail[] = courseIds.map((cid) => {
          const moduleList = modulesByCourse.get(String(cid)) ?? [];
          const lessonIds: string[] = moduleList.flatMap((mid) => lessonsByModule.get(mid) ?? []);
          const totalLessons = lessonIds.length;
          const completedLessons = lessonIds.reduce((acc, lid) => acc + (lessonProgress?.[lid] ? 1 : 0), 0);
          const completedLessonItems = lessonIds
            .filter((lid) => !!lessonProgress?.[lid])
            .map((lid) => ({ id: lid, title: lessonTitleById.get(lid) ?? `Lesson ${lid}` }));
          const inProgressLessonItems = lessonIds
            .filter((lid) => !lessonProgress?.[lid])
            .map((lid) => ({ id: lid, title: lessonTitleById.get(lid) ?? `Lesson ${lid}` }));
          const percent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
          const status = (courseProgress?.[cid] ?? "in-progress") as "in-progress" | "completed";
          return {
            id: String(cid),
            title: titleById.get(String(cid)) ?? `Course ${cid}`,
            totalLessons,
            completedLessons,
            inProgressLessons: Math.max(0, totalLessons - completedLessons),
            percent,
            status,
            completedLessonItems,
            inProgressLessonItems,
          };
        });

        // Sort by status then title
        details.sort((a, b) => {
          if (a.status !== b.status) return a.status === "completed" ? -1 : 1;
          return a.title.localeCompare(b.title);
        });
        setCourseDetails(details);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to compute analytics";
        setAnalyticsError(msg);
      } finally {
        setAnalyticsLoading(false);
      }
    };
    doAnalytics();
  }, [studentId, courseProgress, lessonProgress]);

  const name = useMemo(() => {
    if (!student) return "";
    return (
      student.display_name || [student.first_name, student.last_name].filter(Boolean).join(" ") || "(No name)"
    );
  }, [student]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">Student Detail</h1>
          <p className="opacity-70">View student profile and progress.</p>
        </div>
        <Link className="text-sm underline text-emerald-600" href="/admin/students">← Back to Students</Link>
      </div>

      <div className="rounded-2xl border bg-white/70 dark:bg-white/10 backdrop-blur p-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-emerald-400 to-cyan-400 text-white flex items-center justify-center text-xl font-bold">
            {student?.avatar_url ? (
              <Image src={student.avatar_url} alt={name || "avatar"} fill sizes="64px" className="object-cover" />
            ) : (
              <span>{name?.[0]?.toUpperCase() || "?"}</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-xl truncate">{name || "Loading..."}</div>
            <div className="text-sm opacity-70 truncate">{student?.email || "—"}</div>
            {student?.created_at && (
              <div className="text-xs opacity-60">Joined {new Date(student.created_at).toLocaleString()}</div>
            )}
          </div>
        </div>
        {/* Status / Error for profile fetch */}
        {studentsStatus === "loading" && <div className="mt-3 text-sm opacity-70">Loading profile…</div>}
        {studentsStatus === "failed" && (
          <div className="mt-3 text-sm text-red-600 dark:text-red-300">{studentsError || "Failed to load profile"}</div>
        )}
      </div>

      {/* Summary analytics */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border bg-white/70 dark:bg-white/10 backdrop-blur p-6 shadow-md">
          <div className="text-sm opacity-70 mb-1">Courses</div>
          <div className="text-3xl font-bold">{courseDetails.length}</div>
          <div className="mt-2 text-xs">
            <span className="mr-3">Completed: <span className="font-semibold">{courseDetails.filter(c => c.status === "completed").length}</span></span>
            <span>In-progress: <span className="font-semibold">{courseDetails.filter(c => c.status !== "completed").length}</span></span>
          </div>
        </div>
        <div className="rounded-2xl border bg-white/70 dark:bg-white/10 backdrop-blur p-6 shadow-md">
          <div className="text-sm opacity-70 mb-1">Lessons Completed</div>
          <div className="text-3xl font-bold">
            {courseDetails.reduce((a, c) => a + c.completedLessons, 0)}
            <span className="text-base font-normal opacity-70"> / {courseDetails.reduce((a, c) => a + c.totalLessons, 0)}</span>
          </div>
          {(() => {
            const total = courseDetails.reduce((a, c) => a + c.totalLessons, 0) || 0;
            const done = courseDetails.reduce((a, c) => a + c.completedLessons, 0);
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <progress className="w-full h-2 [appearance:none] overflow-hidden rounded-full bg-black/10 dark:bg-white/10" value={pct} max={100} />
            );
          })()}
        </div>
        <div className="rounded-2xl border bg-white/70 dark:bg-white/10 backdrop-blur p-6 shadow-md">
          <div className="text-sm opacity-70 mb-1">Overall Completion</div>
          {(() => {
            const total = courseDetails.reduce((a, c) => a + c.totalLessons, 0) || 0;
            const done = courseDetails.reduce((a, c) => a + c.completedLessons, 0);
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return <div className="text-3xl font-bold">{pct}%</div>;
          })()}
          <div className="mt-2 text-xs opacity-70">Across all enrolled courses</div>
        </div>
      </div>

      <div className="flex justify-center">
        {/* Course Progress (centered) */}
        <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
          <div className="text-center">
            <div className="text-lg font-semibold tracking-wide mb-1">Course Progress</div>
            <div className="text-xs opacity-60">Per-course completion breakdown</div>
          </div>
          {analyticsLoading && (
            <div className="flex items-center gap-2 opacity-70 animate-pulse">
              <svg className="animate-spin h-5 w-5 text-emerald-500" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
              Crunching analytics…
            </div>
          )}
          {analyticsError && (
            <div className="mt-4 text-center text-red-600 dark:text-red-300">{analyticsError}</div>
          )}
          {courseProgressStatus === "loading" && !analyticsLoading && (
            <div className="flex items-center gap-2 opacity-70 animate-pulse">
              <svg className="animate-spin h-5 w-5 text-emerald-500" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
              Loading…
            </div>
          )}
          {courseProgressStatus === "failed" && (
            <div className="text-red-600 dark:text-red-300">{courseProgressError || "Failed to load course progress"}</div>
          )}
          {Object.keys(courseProgress || {}).length === 0 && courseProgressStatus === "succeeded" && courseDetails.length === 0 && (
            <div className="opacity-70 text-sm">No course progress yet.</div>
          )}
          {courseDetails.length > 0 && (
            <ul className="mt-4 space-y-3">
              {courseDetails.map((c) => (
                <li key={c.id} className="group rounded-2xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-white/10 p-4 md:p-5 shadow-sm hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between mb-2 gap-3">
                    <div className="font-semibold truncate" title={c.title}>{c.title}</div>
                    <span className={`text-xs font-semibold rounded-full px-2 py-1 ${c.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="text-xs opacity-70 mb-2">
                    {c.completedLessons} / {c.totalLessons} lessons • {c.percent}%
                  </div>
                  <progress className="w-full h-2 [appearance:none] overflow-hidden rounded-full bg-black/10 dark:bg-white/10" value={c.percent} max={100} />
                  <div className="mt-2 text-xs flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-medium">
                      Completed: {c.completedLessons}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 font-medium">
                      In progress: {c.inProgressLessons}
                    </span>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      className="text-xs underline text-emerald-600 hover:text-cyan-600"
                      onClick={() => setExpanded((prev) => ({ ...prev, [c.id]: !prev[c.id] }))}
                    >
                      {expanded[c.id] ? "Hide lessons" : "View lessons"}
                    </button>
                    {expanded[c.id] && (
                      <div className="mt-2 grid gap-4 sm:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold mb-1">Completed ({c.completedLessonItems.length})</div>
                          {c.completedLessonItems.length === 0 ? (
                            <div className="text-xs opacity-60">None</div>
                          ) : (
                            <ul className="space-y-1 max-h-48 overflow-auto pr-1">
                              {c.completedLessonItems.map((l) => (
                                <li key={l.id} className="text-xs truncate">
                                  <Link href={`/admin/lessons/${l.id}`} className="underline underline-offset-2">
                                    {l.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-semibold mb-1">In progress ({c.inProgressLessonItems.length})</div>
                          {c.inProgressLessonItems.length === 0 ? (
                            <div className="text-xs opacity-60">None</div>
                          ) : (
                            <ul className="space-y-1 max-h-48 overflow-auto pr-1">
                              {c.inProgressLessonItems.map((l) => (
                                <li key={l.id} className="text-xs truncate">
                                  <Link href={`/admin/lessons/${l.id}`} className="underline underline-offset-2">
                                    {l.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
