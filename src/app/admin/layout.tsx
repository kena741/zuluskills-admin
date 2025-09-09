import Link from "next/link";
import React from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="w-64 bg-white/80 dark:bg-black/20 border-r p-6 space-y-8">
                <div>
                    <h2 className="text-xl font-bold mb-6">Dashboard</h2>
                    <nav className="space-y-4">
                        <Link href="/admin" className="block px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30">Analytics</Link>
                        <Link href="/admin/courses" className="block px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30">Courses</Link>
                        <Link href="/admin/students" className="block px-2 py-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30">Students</Link>
                    </nav>
                </div>
            </aside>
            {/* Main content */}
            <main className="flex-1 p-8">{children}</main>
        </div>
    );
}
