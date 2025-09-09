import React from "react";

export default function StudentsPage() {
    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-semibold">Students</h1>
                <p className="opacity-70">View and manage students.</p>
            </div>
            {/* Add students management UI here */}
            <div className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-4">
                <div className="font-medium mb-3">Students management coming soon…</div>
            </div>
        </div>
    );
}
