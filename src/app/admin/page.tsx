"use client";

import React from "react";

export default function AdminHome() {
    // ...existing code...

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-semibold">Dashboard • Analytics</h1>
                <p className="opacity-70">Overview of platform analytics.</p>
            </div>
            {/* You can add analytics widgets or summary here */}
            <div className="rounded-2xl border bg-white/60 dark:bg-white/5 backdrop-blur p-4">
                <div className="font-medium mb-3">Analytics coming soon…</div>
            </div>
        </div>
    );
}
