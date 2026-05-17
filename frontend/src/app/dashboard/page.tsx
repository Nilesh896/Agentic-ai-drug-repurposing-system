"use client";

import { useState } from "react";

import toast from "react-hot-toast";

import { useAuthStore } from "@/store/auth.store";

import { generateResearch } from "@/services/research.service";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

import DashboardLayout from "@/components/layout/DashboardLayout";

export default function DashboardPage() {
    const { token } = useAuthStore();

    const [query, setQuery] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [report, setReport] =
        useState("");

    const [pdfUrl, setPdfUrl] =
        useState("");

    const handleGenerate =
        async () => {
            try {
                setLoading(true);

                const response =
                    await generateResearch(
                        query,
                        token as string
                    );

                setReport(
                    response.data.aiReport
                );

                setPdfUrl(
                    response.data.savedReport
                        .pdfUrl
                );

                toast.success(
                    "Research generated"
                );
            } catch (error) {
                toast.error(
                    "Failed to generate research"
                );
            } finally {
                setLoading(false);
            }
        };

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div>
                    <h1 className="text-4xl font-bold mb-8 text-white">
                        AI Drug Repurposing Dashboard
                    </h1>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <div className="flex gap-4">
                            <input
                                type="text"
                                placeholder="Enter drug or disease..."
                                value={query}
                                onChange={(e) =>
                                    setQuery(
                                        e.target.value
                                    )
                                }
                                className="flex-1 p-4 rounded-lg bg-zinc-800 border border-zinc-700 text-white"
                            />

                            <button
                                onClick={
                                    handleGenerate
                                }
                                disabled={loading}
                                className="px-6 py-4 bg-white text-black rounded-lg font-semibold hover:bg-zinc-300 transition"
                            >
                                {loading
                                    ? "Generating..."
                                    : "Generate"}
                            </button>
                        </div>
                    </div>

                    {report && (
                        <div className="mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-white">
                                    AI Research Report
                                </h2>

                                <a
                                    href={`http://localhost:5000${pdfUrl}`}
                                    target="_blank"
                                    className="bg-white text-black px-4 py-2 rounded-lg font-semibold"
                                >
                                    Download PDF
                                </a>
                            </div>

                            <div className="whitespace-pre-wrap text-zinc-300 leading-7">
                                {report}
                            </div>
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}