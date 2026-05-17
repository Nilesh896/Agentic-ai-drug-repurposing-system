"use client";

import {
    useEffect,
    useState,
} from "react";

import { useParams } from "next/navigation";

import toast from "react-hot-toast";

import ReactMarkdown from "react-markdown";

import ProtectedRoute from "@/components/auth/ProtectedRoute";

import DashboardLayout from "@/components/layout/DashboardLayout";

import { useAuthStore } from "@/store/auth.store";

import { fetchReportById } from "@/services/history.service";

export default function ReportDetailsPage() {
    const params = useParams();

    const { token } =
        useAuthStore();

    const [report, setReport] =
        useState<any>(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        const getReport =
            async () => {
                try {
                    const response =
                        await fetchReportById(
                            params.id as string,
                            token as string
                        );

                    setReport(
                        response.data
                    );
                } catch (error) {
                    toast.error(
                        "Failed to fetch report"
                    );
                } finally {
                    setLoading(false);
                }
            };

        if (params.id && token) {
            getReport();
        }
    }, [params.id, token]);

    if (loading) {
        return (
            <ProtectedRoute>
                <DashboardLayout>
                    <p className="text-zinc-400">
                        Loading report...
                    </p>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    if (!report) {
        return (
            <ProtectedRoute>
                <DashboardLayout>
                    <p className="text-red-500">
                        Report not found
                    </p>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div>
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-5xl font-bold text-white mb-4">
                                {report.title}
                            </h1>

                            <p className="text-zinc-400">
                                {new Date(
                                    report.createdAt
                                ).toLocaleString()}
                            </p>
                        </div>

                        <a
                            href={`http://localhost:5000${report.pdfUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white text-black px-6 py-3 rounded-xl font-semibold"
                        >
                            Download PDF
                        </a>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-10 md:p-14 shadow-xl">
                        <article className="prose prose-invert max-w-none prose-lg leading-loose space-y-8 prose-headings:mt-12 prose-headings:mb-6 prose-headings:font-bold prose-headings:text-white prose-p:my-6 prose-p:leading-relaxed prose-p:text-zinc-300 prose-li:my-3 prose-li:text-zinc-300 prose-ul:my-6 prose-strong:text-white prose-strong:font-semibold tracking-wide">
                            <ReactMarkdown>
                                {report.summary || report.aiInsights || report.content || "No summary available"}
                            </ReactMarkdown>
                        </article>
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}