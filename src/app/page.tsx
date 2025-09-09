import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* background gradient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[920px] rounded-full blur-3xl bg-gradient-to-br from-sky-400/20 via-fuchsia-400/10 to-emerald-400/20 dark:from-cyan-300/15 dark:via-violet-400/10 dark:to-lime-300/15" />
      </div>

      {/* header */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-500 to-emerald-500 text-white font-semibold">A</span>
          <span className="font-semibold tracking-tight">Aura Learning</span>
        </div>
        <nav className="hidden sm:flex items-center gap-2 text-sm">
          <Link className="px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10" href="/admin">Dashboard</Link>
        </nav>
      </header>

      {/* hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            <h1 className="text-4xl sm:text-5xl font-semibold leading-[1.1] tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-white/70 bg-clip-text text-transparent">
              Learn by doing. Track your progress. Level up fast.
            </h1>
            <p className="text-base sm:text-lg opacity-80">
              Modern courses with hands‑on lessons, step‑by‑step modules, and clear milestones. Your learning journey, beautifully organized.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard" className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium bg-emerald-500 text-white border border-emerald-600 hover:bg-emerald-600">
                Start learning
              </Link>
              <Link href="/courses" className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium border hover:bg-black/5 dark:hover:bg-white/10">
                Browse courses
              </Link>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="rounded-xl border px-3 py-2 bg-white/60 dark:bg-white/5 backdrop-blur">
                <span className="font-semibold">Step‑by‑step</span> modules
              </div>
              <div className="rounded-xl border px-3 py-2 bg-white/60 dark:bg-white/5 backdrop-blur">
                Progress tracking
              </div>
              <div className="rounded-xl border px-3 py-2 bg-white/60 dark:bg-white/5 backdrop-blur">
                Interactive lessons
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-4 shadow-sm">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl border p-4">
                  <div className="text-2xl font-semibold">92%</div>
                  <div className="opacity-70">Avg. course completion</div>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-2xl font-semibold">+34%</div>
                  <div className="opacity-70">Faster skill gain</div>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-2xl font-semibold">4.8★</div>
                  <div className="opacity-70">Learner rating</div>
                </div>
              </div>
              <div className="mt-4 rounded-xl border p-4">
                <div className="mb-2 font-medium">Your next steps</div>
                <ol className="list-decimal list-inside space-y-1 opacity-85">
                  <li>Pick a course</li>
                  <li>Complete the first lesson</li>
                  <li>Track progress to unlock more</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-5">
            <div className="text-lg font-medium mb-1">Guided Learning</div>
            <p className="text-sm opacity-80">Modules and lessons unlock as you progress, keeping you focused and motivated.</p>
          </div>
          <div className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-5">
            <div className="text-lg font-medium mb-1">Visual Progress</div>
            <p className="text-sm opacity-80">Clear milestones and completion badges make your achievements obvious.</p>
          </div>
          <div className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-5">
            <div className="text-lg font-medium mb-1">Flexible Content</div>
            <p className="text-sm opacity-80">Video, text, tasks, and quizzes—learn the way that works best for you.</p>
          </div>
        </div>
      </section>

      {/* callout */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-2xl border bg-white/70 dark:bg-white/5 backdrop-blur p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xl font-semibold">Ready to begin?</div>
            <p className="text-sm opacity-80">Jump into your dashboard and continue where you left off.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium bg-sky-600 text-white border border-sky-700 hover:bg-sky-700">
              Go to dashboard
            </Link>
            <Link href="/courses" className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-medium border hover:bg-black/5 dark:hover:bg-white/10">
              Explore courses
            </Link>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="text-xs opacity-70">© {new Date().getFullYear()} Aura Learning. All rights reserved.</div>
      </footer>
    </main>
  );
}
