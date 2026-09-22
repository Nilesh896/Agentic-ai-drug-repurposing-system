"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";

import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/store/auth.store";
import { fetchReportById } from "@/services/history.service";

function formatAiInsights(content?: string): string {
    if (!content) return "";
    try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === "object" && (parsed.researchQuestion || parsed.summary)) {
            const sections = [
                parsed.researchQuestion ? `# Research Question\n\n${parsed.researchQuestion}` : null,
                parsed.summary ? `# Executive Summary\n\n${parsed.summary}` : null,
                parsed.evidenceOverview ? `# Evidence Overview\n\n${parsed.evidenceOverview}` : null,
                parsed.literatureEvidence ? `# Literature Evidence\n\n${parsed.literatureEvidence}` : null,
                parsed.clinicalTrialEvidence ? `# Clinical Trial Evidence\n\n${parsed.clinicalTrialEvidence}` : null,
                parsed.drugOverview ? `# Drug Overview\n\n${parsed.drugOverview}` : null,
                parsed.diseaseOverview ? `# Target Disease Overview\n\n${parsed.diseaseOverview}` : null,
                parsed.repurposingRationale ? `# Repurposing Rationale\n\n${parsed.repurposingRationale}` : null,
                parsed.safety ? `# Safety & Contraindications\n\n${parsed.safety}` : null,
                parsed.assessment ? `# Repurposing Assessment\n\n${parsed.assessment}` : null,
                parsed.limitations ? `# Limitations\n\n${parsed.limitations}` : null,
                parsed.conclusion ? `# Conclusion\n\n${parsed.conclusion}` : null,
            ].filter(Boolean);
            return sections.join("\n\n");
        }
    } catch {
        // Raw markdown string, return as-is
    }
    return content;
}

export default function ReportDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { token } = useAuthStore();

    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getReport = async () => {
            try {
                const response = await fetchReportById(
                    params.id as string,
                    token as string
                );
                if (response.success) {
                    setReport(response.data);
                } else {
                    toast.error(response.message || "Failed to fetch report");
                }
            } catch (error) {
                toast.error("Failed to fetch report");
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
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    if (!report) {
        return (
            <ProtectedRoute>
                <DashboardLayout>
                    <div className="text-center py-12">
                        <p className="text-zinc-500 mb-4">Report not found</p>
                        <button
                            onClick={() => router.push("/history")}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm transition font-medium"
                        >
                            Back to History
                        </button>
                    </div>
                </DashboardLayout>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-6 border-b border-zinc-900 gap-4">
                        <div>
                            <button
                                onClick={() => router.push("/history")}
                                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 mb-2 transition"
                            >
                                ← Back to History
                            </button>
                            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
                                {report.title}
                            </h1>
                            <p className="text-xs text-zinc-500">
                                Generated on {new Date(report.createdAt).toLocaleString()}
                            </p>
                        </div>

                        {report.pdfUrl && (
                            <a
                                href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${report.pdfUrl}?token=${token}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
                            >
                                Download PDF Report
                            </a>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="space-y-8">
                        {/* Summary View */}
                        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-8 md:p-10 shadow-sm">
                            <h2 className="text-lg font-bold text-white mb-6 border-b border-zinc-900 pb-3 tracking-tight">
                                Research Summary
                            </h2>
                            <article className="prose prose-zinc prose-invert max-w-none prose-headings:text-white prose-headings:font-bold prose-p:text-zinc-300 prose-p:leading-relaxed prose-li:text-zinc-300 prose-strong:text-white leading-relaxed">
                                <ReactMarkdown>
                                    {report.summary || report.content || "No summary available"}
                                </ReactMarkdown>
                            </article>
                        </div>

                        {/* Detailed Analysis View */}
                        {report.aiInsights && (
                            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-8 md:p-10 shadow-sm">
                                <h2 className="text-lg font-bold text-white mb-6 border-b border-zinc-900 pb-3 tracking-tight">
                                    Detailed AI Analysis Insights
                                </h2>
                                <article className="prose prose-zinc prose-invert max-w-none prose-headings:text-white prose-headings:font-bold prose-p:text-zinc-300 prose-p:leading-relaxed prose-li:text-zinc-300 prose-strong:text-white leading-relaxed">
                                    <ReactMarkdown>
                                        {formatAiInsights(report.aiInsights)}
                                    </ReactMarkdown>
                                </article>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}