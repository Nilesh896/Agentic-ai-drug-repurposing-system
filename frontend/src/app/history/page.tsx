"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/store/auth.store";
import { fetchReports } from "@/services/history.service";
import { ResearchReport } from "@/types/history.types";

const generatePreview = (text?: string) => {
    if (!text) return "";
    let clean = text
        .replace(/#+\s/g, "") // Headers
        .replace(/!\[.*?\]\(.*?\)/g, "") // Images
        .replace(/\[(.*?)\]\(.*?\)/g, "$1") // Links
        .replace(/[*_~`>]/g, "") // Markdown symbols
        .replace(/\n+/g, " ") // Newlines
        .replace(/\s+/g, " ") // Extra whitespace
        .trim();

    if (clean.length > 280) {
        clean = clean.substring(0, 280);
        const lastSpace = clean.lastIndexOf(" ");
        if (lastSpace > 0) {
            clean = clean.substring(0, lastSpace);
        }
        clean += "...";
    }

    return clean;
};

export default function HistoryPage() {
    const router = useRouter();
    const { token } = useAuthStore();

    const [reports, setReports] = useState<ResearchReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getReports = async () => {
            try {
                const response = await fetchReports(token as string);
                if (response.success) {
                    setReports(response.data);
                } else {
                    toast.error(response.message || "Failed to fetch reports");
                }
            } catch (error) {
                toast.error("Failed to fetch reports");
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            getReports();
        }
    }, [token]);

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="space-y-8">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
                            Research History
                        </h1>
                        <p className="text-zinc-400 text-sm max-w-xl">
                            Browse details of past research reports, view summaries, or download compiled documents.
                        </p>
                    </div>

                    {loading ? (
                        <div className="flex items-center gap-3 text-zinc-500 py-12">
                            <div className="w-5 h-5 border-2 border-zinc-800 border-t-indigo-500 rounded-full animate-spin"></div>
                            <span className="text-sm">Loading historical reports...</span>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-12 text-center text-zinc-500 shadow-sm">
                            No historical reports found. Go to the dashboard to generate your first analysis.
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {reports.map((report) => (
                                <div
                                    key={report.id}
                                    className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 hover:border-zinc-800 transition duration-200 shadow-sm flex flex-col sm:flex-row justify-between items-start gap-6"
                                >
                                    <div className="flex-1 space-y-2">
                                        <h2 className="text-xl font-bold text-white tracking-tight">
                                            {report.title}
                                        </h2>

                                        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                                            {new Date(report.createdAt).toLocaleString()}
                                        </p>

                                        <p className="text-zinc-400 text-sm leading-relaxed max-w-3xl">
                                            {generatePreview(
                                                report.summary || report.aiInsights || report.content
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex sm:flex-col gap-3 w-full sm:w-auto">
                                        <button
                                            onClick={() => router.push(`/history/${report.id}`)}
                                            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold text-xs tracking-wide transition cursor-pointer text-center"
                                        >
                                            Open View
                                        </button>

                                        {report.pdfUrl && (
                                            <a
                                                href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${report.pdfUrl}?token=${token}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 sm:flex-none bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-lg font-semibold text-xs tracking-wide transition text-center"
                                            >
                                                PDF Report
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}