"use client";

import {
    useEffect,
    useState,
} from "react";

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

    if (clean.length > 200) {
        clean = clean.substring(0, 200);
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

    const { token } =
        useAuthStore();

    const [reports, setReports] =
        useState<
            ResearchReport[]
        >([]);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        const getReports =
            async () => {
                try {
                    const response =
                        await fetchReports(
                            token as string
                        );

                    setReports(
                        response.data
                    );
                } catch (error) {
                    toast.error(
                        "Failed to fetch reports"
                    );
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
                <div>
                    <h1 className="text-4xl font-bold text-white mb-8">
                        Research History
                    </h1>

                    {loading ? (
                        <p className="text-zinc-400">
                            Loading reports...
                        </p>
                    ) : reports.length ===
                        0 ? (
                        <p className="text-zinc-400">
                            No reports found.
                        </p>
                    ) : (
                        <div className="grid gap-6">
                            {reports.map(
                                (report) => (
                                    <div
                                        key={report.id}
                                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-600 transition"
                                    >
                                        <div className="flex justify-between items-start gap-6">
                                            <div className="flex-1">
                                                <h2 className="text-2xl font-bold text-white mb-2">
                                                    {
                                                        report.title
                                                    }
                                                </h2>

                                                <p className="text-zinc-400 text-sm mb-4">
                                                    {new Date(
                                                        report.createdAt
                                                    ).toLocaleString()}
                                                </p>

                                                <p className="text-zinc-300 text-sm leading-relaxed mt-2">
                                                    {generatePreview(
                                                        report.summary || report.aiInsights || report.content
                                                    )}
                                                </p>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={() =>
                                                        router.push(
                                                            `/history/${report.id}`
                                                        )
                                                    }
                                                    className="bg-white text-black px-4 py-2 rounded-lg font-semibold"
                                                >
                                                    Open
                                                </button>

                                                <a
                                                    href={`http://localhost:5000${report.pdfUrl}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="bg-zinc-700 text-white px-4 py-2 rounded-lg font-semibold text-center"
                                                >
                                                    PDF
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}