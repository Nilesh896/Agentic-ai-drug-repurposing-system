"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

import { useAuthStore } from "@/store/auth.store";
import { generateResearch } from "@/services/research.service";
import { fetchReports, fetchReportById } from "@/services/history.service";
import { ResearchReport } from "@/types/history.types";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";

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

export default function DashboardPage() {
    const router = useRouter();
    const { token } = useAuthStore();

    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState("");
    const [pdfUrl, setPdfUrl] = useState("");
    const [recentReports, setRecentReports] = useState<ResearchReport[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [latestResearchData, setLatestResearchData] = useState<any>(null);
    const [showMarketModal, setShowMarketModal] = useState(false);

    // Close market intelligence explanation modal on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setShowMarketModal(false);
            }
        };
        if (showMarketModal) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [showMarketModal]);

    // Fetch existing research history for recent reports section & account stats
    useEffect(() => {
        if (!token) return;
        const loadHistory = async () => {
            try {
                setLoadingHistory(true);
                const res = await fetchReports(token as string);
                if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                    setRecentReports(res.data.slice(0, 3));
                    // Fetch full report data of most recent report for evidence fingerprint & constellation
                    try {
                        const latestRes = await fetchReportById(res.data[0].id, token as string);
                        if (latestRes.success && latestRes.data) {
                            setLatestResearchData(latestRes.data);
                        }
                    } catch {
                        // Silently handle if individual report fetch fails
                    }
                }
            } catch {
                // Silently ignore background history fetch error on dashboard
            } finally {
                setLoadingHistory(false);
            }
        };
        loadHistory();
    }, [token]);

    const exampleChips = [
        { label: "Metformin → Cancer", value: "Metformin in cancer" },
        { label: "Paracetamol → Sepsis", value: "Paracetamol use in sepsis" },
        { label: "Aspirin → Cancer", value: "Aspirin in colorectal cancer" },
        { label: "Hydroxychloroquine → COVID-19", value: "Hydroxychloroquine in COVID-19" },
    ];

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!query.trim()) {
            toast.error("Please enter a drug or disease name");
            return;
        }

        try {
            setLoading(true);
            setReport("");
            setPdfUrl("");

            const response = await generateResearch(query, token as string);

            if (response.success) {
                setReport(response.data.aiReport);
                setPdfUrl(response.data.savedReport.pdfUrl);
                setLatestResearchData(response.data);
                toast.success("Research report generated successfully");

                // Refresh recent reports list with newly generated report
                if (response.data.savedReport) {
                    setRecentReports((prev) => [response.data.savedReport, ...prev].slice(0, 3));
                }
            } else {
                toast.error(response.message || "Failed to generate research");
            }
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Failed to generate research. Please try again.";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Extract deterministic evidence metrics for Evidence Fingerprint and Evidence Constellation
    const articles: any[] = latestResearchData?.literatureData?.articles || [];
    const trials: any[] = latestResearchData?.clinicalTrialData?.trials || [];
    const fdaData: any = latestResearchData?.drugInfoData?.drugData || null;

    const directCount =
        articles.filter((a) => a.relevance === "DIRECT").length +
        trials.filter((t) => t.relevance === "DIRECT").length;

    const relatedCount =
        articles.filter((a) => a.relevance === "RELATED").length +
        trials.filter((t) => t.relevance === "RELATED").length;

    const indirectCount =
        articles.filter((a) => a.relevance === "INDIRECT").length +
        trials.filter((t) => t.relevance === "INDIRECT").length;

    const literatureCount = articles.length;
    const trialsCount = trials.length;
    const hasRegulatory = Boolean(fdaData && fdaData.genericName);
    const hasEvidenceData = Boolean(latestResearchData && (literatureCount > 0 || trialsCount > 0 || hasRegulatory));

    const maxFingerprintCount = Math.max(literatureCount, trialsCount, directCount, relatedCount, indirectCount, 1);

    // Derive center node research subject strictly from query data, NEVER from FDA product labels
    const rawQueryString =
        (typeof latestResearchData?.query === "object" ? latestResearchData?.query?.drugName : "") ||
        latestResearchData?.drugName ||
        latestResearchData?.researchQuery?.drugName ||
        (typeof latestResearchData?.query === "string" ? latestResearchData.query : "") ||
        latestResearchData?.savedReport?.title?.replace(/^Research Report for\s*/i, "") ||
        latestResearchData?.title?.replace(/^Research Report for\s*/i, "") ||
        query ||
        "";

    const extractedDrug =
        (typeof latestResearchData?.query === "object" && latestResearchData?.query?.drugName) ||
        latestResearchData?.drugName ||
        latestResearchData?.researchQuery?.drugName ||
        (rawQueryString
            ? rawQueryString
                .replace(/^Research Report for\s*/i, "")
                .replace(/^(?:investigate|research|study|evaluate|analysis of)\s+/i, "")
                .split(/\s+(?:use in|used in|in|for|and|as treatment for|to treat|treating|against)\s+/i)[0]
                .trim()
            : "") ||
        "DRUG";

    const centerDrugLabel = extractedDrug.toUpperCase().slice(0, 16);

    const constellationArticles = articles.slice(0, 4);
    const constellationTrials = trials.slice(0, 3);

    // Research Gap Explorer deterministic metrics
    const directLiteratureCount = articles.filter((a) => a.relevance === "DIRECT").length;
    const directTrialCount = trials.filter((t) => t.relevance === "DIRECT").length;
    const relatedLiteratureCount = articles.filter((a) => a.relevance === "RELATED").length;
    const relatedTrialCount = trials.filter((t) => t.relevance === "RELATED").length;
    const indirectLiteratureCount = articles.filter((a) => a.relevance === "INDIRECT").length;
    const indirectTrialCount = trials.filter((t) => t.relevance === "INDIRECT").length;

    // Distinct trial phases
    const trialPhases = Array.from(
        new Set(
            trials.flatMap((t) => {
                if (Array.isArray(t.phase)) return t.phase;
                if (typeof t.phase === "string") return [t.phase];
                return [];
            }).filter((p) => p && p !== "NA" && p !== "NOT_APPLICABLE")
        )
    );

    // Distinct trial statuses
    const trialStatuses = Array.from(
        new Set(
            trials.map((t) => t.status).filter((s) => s && s !== "UNKNOWN")
        )
    );

    // Deterministic Gap Identification (Patterns A, B, C, D, E, F)
    let gapFindingText = "";
    let gapDetailText = "";

    if (trialsCount === 0 && literatureCount > 0) {
        gapFindingText = "Biomedical literature was retrieved for this hypothesis, but no corresponding clinical-trial records were identified in the current search.";
        gapDetailText = "Retrieved evidence is exclusively literature-based, indicating a need to investigate whether clinical-stage trials exist in alternate registries.";
    } else if (trialsCount > 0 && directTrialCount === 0) {
        gapFindingText = "No directly relevant clinical-trial records were retrieved for this query.";
        gapDetailText = `All ${trialsCount} retrieved trial(s) are categorized as related or indirect, while directly relevant clinical-trial records remain unrepresented in this search scope.`;
    } else if (directLiteratureCount > directTrialCount && directLiteratureCount >= 3) {
        gapFindingText = "Within the retrieved dataset, directly relevant literature is more extensive than directly relevant clinical-trial evidence.";
        gapDetailText = `Retrieved evidence contains ${directLiteratureCount} directly relevant literature publication(s) versus ${directTrialCount} direct clinical-trial record(s), pointing to an evidentiary focus in published research compared to active clinical trials.`;
    } else if (literatureCount >= trialsCount * 2 && literatureCount > 3) {
        gapFindingText = "Retrieved evidence is more concentrated in biomedical literature than clinical-trial records.";
        gapDetailText = `Biomedical literature (${literatureCount} records) outnumbers registered clinical trials (${trialsCount} records) within the retrieved dataset.`;
    } else if (directCount > 0 && relatedCount > 0) {
        gapFindingText = "Retrieved evidence includes both directly relevant and related records; relevance varies across the evidence sources.";
        gapDetailText = "The retrieved evidence set spans both targeted hypothesis investigations and broader contextual studies across literature and trials.";
    } else {
        gapFindingText = "Retrieved evidence is distributed across available sources within the current search scope.";
        gapDetailText = "Evidence volume is limited within the retrieved dataset; additional keywords or broader synonym expansion may yield further records.";
    }

    // Deterministic Next Research Question
    let nextQuestion = "";
    let nextQuestionRationale = "";

    if (trialPhases.length >= 2) {
        nextQuestion = "Which clinical-trial phase has the strongest representation in the retrieved evidence?";
        nextQuestionRationale = `Retrieved clinical trials span multiple development phases (${trialPhases.slice(0, 3).join(", ")}), suggesting an ongoing or multi-stage clinical evaluation pathway.`;
    } else if (directTrialCount === 0 && trialsCount > 0) {
        nextQuestion = "What prospective clinical studies or registry entries might exist beyond this initial search?";
        nextQuestionRationale = "No directly relevant clinical-trial records were retrieved for this query, highlighting an exploratory need to search specialized clinical registries.";
    } else if (directLiteratureCount >= 3 && directTrialCount <= 1) {
        nextQuestion = "What clinical evidence exists beyond the retrieved literature for this repurposing hypothesis?";
        nextQuestionRationale = `Direct literature evidence (${directLiteratureCount} records) is substantially richer than direct trial records (${directTrialCount}), indicating potential for further clinical translation inquiry.`;
    } else if (trialStatuses.length >= 2) {
        nextQuestion = "What do the retrieved trial statuses indicate about the current stage of clinical investigation?";
        nextQuestionRationale = `Retrieved trials display varied study statuses (${trialStatuses.slice(0, 3).join(", ")}), reflecting varied completion and recruitment timelines across study centers.`;
    } else if (trialsCount === 0 && literatureCount > 0) {
        nextQuestion = "What clinical evidence exists beyond the retrieved literature for this repurposing hypothesis?";
        nextQuestionRationale = "Biomedical literature was retrieved without matching clinical trial records in the initial search scope.";
    } else {
        nextQuestion = "How do the observed mechanism findings in retrieved literature correlate with clinical investigation outcomes?";
        nextQuestionRationale = "Evaluating published mechanistic findings against registered clinical endpoints provides a structured next step for evidence investigation.";
    }

    return (
        <ProtectedRoute>
            <DashboardLayout>
                <div className="space-y-10 pb-12">
                    {/* 1. HERO SECTION */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-black border border-zinc-800/80 p-6 sm:p-8">
                        <div className="absolute -top-24 -left-24 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="relative z-10 space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Research system ready
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                                AI Drug Repurposing Research
                            </h1>
                            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl leading-relaxed">
                                Turn a drug or disease question into an evidence-backed research report.
                            </p>
                        </div>
                    </div>

                    {/* 2. MAIN RESEARCH INPUT (FOCAL POINT) */}
                    <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

                        <form onSubmit={handleGenerate} className="space-y-4 relative z-10">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="e.g. Metformin for cancer..."
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-white placeholder-zinc-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition text-sm sm:text-base"
                                        disabled={loading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !query.trim()}
                                    className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm shrink-0 shadow-lg shadow-indigo-600/20"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Generating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            <span>Generate Research</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Clickable Example Chips */}
                            <div className="pt-2 flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mr-1">
                                    Try a research query:
                                </span>
                                {exampleChips.map((chip) => (
                                    <button
                                        key={chip.label}
                                        type="button"
                                        onClick={() => setQuery(chip.value)}
                                        disabled={loading}
                                        className="text-xs px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-indigo-500/40 hover:bg-zinc-850 text-zinc-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                        <span>{chip.label}</span>
                                    </button>
                                ))}
                            </div>
                        </form>
                    </div>

                    {/* Loading Details Skeleton */}
                    {loading && (
                        <div className="bg-zinc-950 border border-indigo-900/40 rounded-2xl p-8 flex flex-col items-center justify-center space-y-4 shadow-lg shadow-indigo-950/20 animate-pulse">
                            <div className="w-9 h-9 border-3 border-zinc-800 border-t-indigo-500 rounded-full animate-spin" />
                            <div className="text-center space-y-1.5">
                                <p className="text-sm font-semibold text-zinc-200">Orchestrating agentic pipeline...</p>
                                <p className="text-xs text-zinc-400 max-w-md">
                                    Querying PubMed literature, ClinicalTrials.gov registry, and OpenFDA drug labels in parallel for synthesis.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Report Output Cards */}
                    {report && (
                        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
                            {/* Report Header */}
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center p-6 sm:p-8 border-b border-zinc-850 bg-zinc-900/40 gap-4">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-2">
                                        Synthesized Evidence Dossier
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                                        AI Research Report Summary
                                    </h2>
                                    <p className="text-xs text-zinc-400 mt-0.5">
                                        Synthesized by Gemini 2.5 Flash with strict 12-field structured grounding
                                    </p>
                                </div>

                                {pdfUrl && (
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${pdfUrl}?token=${token}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 text-center shadow-md shadow-indigo-600/20"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <span>Download PDF Report</span>
                                    </a>
                                )}
                            </div>

                            {/* Report Content */}
                            <div className="p-6 sm:p-10">
                                <article className="prose prose-zinc prose-invert max-w-none prose-headings:text-white prose-headings:font-bold prose-p:text-zinc-300 prose-p:leading-relaxed prose-li:text-zinc-300 prose-strong:text-white leading-relaxed">
                                    <ReactMarkdown>
                                        {formatAiInsights(report)}
                                    </ReactMarkdown>
                                </article>
                            </div>
                        </div>
                    )}

                    {/* 3. RESEARCH INTELLIGENCE / DATA SOURCES */}
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">
                                Research Intelligence & Evidence Sources
                            </h2>
                            <p className="text-xs text-zinc-400">
                                Primary scientific databases and regulatory repositories queried by the multi-agent system
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* PubMed Card (Clickable External Link) */}
                            <a
                                href="https://pubmed.ncbi.nlm.nih.gov/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-zinc-950/70 border border-zinc-850 hover:border-sky-500/40 hover:bg-zinc-900/60 rounded-xl p-5 transition-all duration-150 group cursor-pointer hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-500/30 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform duration-150">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                Live API
                                            </span>
                                            <svg className="w-3.5 h-3.5 text-zinc-500 group-hover:text-sky-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-semibold text-white group-hover:text-sky-300 transition">
                                        PubMed (NCBI)
                                    </h3>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        Biomedical literature, abstracts & peer-reviewed research papers
                                    </p>
                                </div>
                            </a>

                            {/* ClinicalTrials.gov Card (Clickable External Link) */}
                            <a
                                href="https://clinicaltrials.gov/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-zinc-950/70 border border-zinc-850 hover:border-indigo-500/40 hover:bg-zinc-900/60 rounded-xl p-5 transition-all duration-150 group cursor-pointer hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform duration-150">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                            </svg>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                Live API
                                            </span>
                                            <svg className="w-3.5 h-3.5 text-zinc-500 group-hover:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition">
                                        ClinicalTrials.gov
                                    </h3>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        Clinical trial registry, study phases, statuses & outcomes (v2 API)
                                    </p>
                                </div>
                            </a>

                            {/* OpenFDA Card (Clickable External Link) */}
                            <a
                                href="https://open.fda.gov/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-zinc-950/70 border border-zinc-850 hover:border-teal-500/40 hover:bg-zinc-900/60 rounded-xl p-5 transition-all duration-150 group cursor-pointer hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-teal-500/30 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-105 transition-transform duration-150">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                Live API
                                            </span>
                                            <svg className="w-3.5 h-3.5 text-zinc-500 group-hover:text-teal-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-semibold text-white group-hover:text-teal-300 transition">
                                        OpenFDA
                                    </h3>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        Regulatory drug labels, approved indications, warnings & adverse events
                                    </p>
                                </div>
                            </a>

                            {/* Market Intelligence Card (Clickable Modal Trigger) */}
                            <button
                                type="button"
                                onClick={() => setShowMarketModal(true)}
                                className="bg-zinc-950/70 border border-amber-900/40 hover:border-amber-500/50 hover:bg-zinc-900/60 rounded-xl p-5 transition-all duration-150 group cursor-pointer hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500/30 flex flex-col justify-between text-left w-full"
                                aria-haspopup="dialog"
                                aria-expanded={showMarketModal}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform duration-150">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                                MOCK / UNVERIFIED
                                            </span>
                                            <svg className="w-3.5 h-3.5 text-zinc-500 group-hover:text-amber-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition">
                                        Market Intelligence
                                    </h3>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        Simulated patent landscape & commercial projections (simulation component)
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Market Intelligence Simulation Explanation Modal */}
                    {showMarketModal && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                            onClick={() => setShowMarketModal(false)}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="market-modal-title"
                            aria-describedby="market-modal-desc"
                        >
                            <div
                                className="bg-zinc-950 border border-zinc-800 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative space-y-5"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header with amber badge & close button */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 id="market-modal-title" className="text-base font-bold text-white tracking-tight">
                                                Market Intelligence
                                            </h3>
                                            <p className="text-xs text-amber-400 font-medium">Currently simulated</p>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowMarketModal(false)}
                                        className="text-zinc-500 hover:text-zinc-300 transition p-1.5 rounded-lg hover:bg-zinc-900 cursor-pointer"
                                        aria-label="Close dialog"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Badge & Explanation Body */}
                                <div className="space-y-3 pt-1 border-t border-zinc-900">
                                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        MOCK / UNVERIFIED
                                    </div>

                                    <p id="market-modal-desc" className="text-xs text-zinc-300 leading-relaxed">
                                        This module uses mock/simulated market intelligence for demonstration purposes. No live commercial, patent, or market data source is currently connected.
                                    </p>

                                    <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-850 space-y-1.5">
                                        <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                                            Scientific & Compliance Note
                                        </div>
                                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                                            Market simulation data is kept isolated from clinical synthesis and should not be interpreted as verified commercial or patent intelligence.
                                        </p>
                                    </div>
                                </div>

                                {/* Close Button */}
                                <div className="pt-2 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setShowMarketModal(false)}
                                        className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* EVIDENCE LANDSCAPE (FINGERPRINT + CONSTELLATION + INTEGRITY GUARD) */}
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">
                                Evidence Landscape
                            </h2>
                            <p className="text-xs text-zinc-400">
                                Quantitative fingerprint and node distribution of retrieved scientific evidence
                            </p>
                        </div>

                        {/* Fingerprint + Constellation side-by-side */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* 1. EVIDENCE FINGERPRINT */}
                            <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                                <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-white tracking-tight">Evidence Fingerprint</h3>
                                        <p className="text-xs text-zinc-400 mt-0.5">Retrieved quantitative breakdown for recent query</p>
                                    </div>
                                    <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                                        DETERMINISTIC
                                    </span>
                                </div>

                                {hasEvidenceData ? (
                                    <div className="space-y-3.5">
                                        {/* Literature */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-zinc-300 font-medium">Literature</span>
                                                <span className="font-mono text-zinc-400">{literatureCount}</span>
                                            </div>
                                            <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-sky-500 transition-all duration-500"
                                                    style={{ width: `${Math.max(Math.round((literatureCount / maxFingerprintCount) * 100), literatureCount > 0 ? 8 : 0)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Clinical Trials */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-zinc-300 font-medium">Clinical Trials</span>
                                                <span className="font-mono text-zinc-400">{trialsCount}</span>
                                            </div>
                                            <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                                                    style={{ width: `${Math.max(Math.round((trialsCount / maxFingerprintCount) * 100), trialsCount > 0 ? 8 : 0)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Direct Evidence */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-zinc-300 font-medium">Direct Evidence</span>
                                                <span className="font-mono text-emerald-400 font-semibold">{directCount}</span>
                                            </div>
                                            <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                                    style={{ width: `${Math.max(Math.round((directCount / maxFingerprintCount) * 100), directCount > 0 ? 8 : 0)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Related Evidence */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-zinc-300 font-medium">Related Evidence</span>
                                                <span className="font-mono text-amber-400 font-semibold">{relatedCount}</span>
                                            </div>
                                            <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                                                    style={{ width: `${Math.max(Math.round((relatedCount / maxFingerprintCount) * 100), relatedCount > 0 ? 8 : 0)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Indirect Evidence */}
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-zinc-300 font-medium">Indirect Evidence</span>
                                                <span className="font-mono text-zinc-400">{indirectCount}</span>
                                            </div>
                                            <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full bg-zinc-600 transition-all duration-500"
                                                    style={{ width: `${Math.max(Math.round((indirectCount / maxFingerprintCount) * 100), indirectCount > 0 ? 8 : 0)}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Regulatory Record */}
                                        <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-xs">
                                            <span className="text-zinc-300 font-medium">Regulatory Record</span>
                                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                                                hasRegulatory ? "text-teal-400 bg-teal-500/10 border-teal-500/20" : "text-zinc-500 bg-zinc-900 border-zinc-800"
                                            }`}>
                                                {hasRegulatory ? "Available (FDA)" : "Not Indexed"}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-48 flex flex-col items-center justify-center text-center p-4 space-y-2">
                                        <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                        </div>
                                        <p className="text-xs font-medium text-zinc-300">Run research to generate evidence metrics</p>
                                        <p className="text-[11px] text-zinc-500 max-w-xs leading-relaxed">
                                            Evidence fingerprint will summarize literature, trials, and relevance distribution once a query is executed.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* 2. EVIDENCE CONSTELLATION */}
                            <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 flex flex-col justify-between space-y-4">
                                <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-white tracking-tight">Evidence Constellation</h3>
                                        <p className="text-xs text-zinc-400 mt-0.5">Relational map of retrieved identifiers</p>
                                    </div>
                                    <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 select-none pointer-events-none cursor-default">
                                        EVIDENCE MAP
                                    </span>
                                </div>

                                {hasEvidenceData ? (
                                    <div className="flex flex-col items-center">
                                        <svg viewBox="0 0 460 250" className="w-full h-auto max-h-60 select-none">
                                            {/* Background radar rings */}
                                            <circle cx="230" cy="125" r="95" fill="none" stroke="#27272a" strokeDasharray="3 3" strokeWidth="1" />
                                            <circle cx="230" cy="125" r="55" fill="none" stroke="#1f1f23" strokeDasharray="2 2" strokeWidth="1" />

                                            {/* Connecting lines from Center to PubMed nodes */}
                                            {constellationArticles.map((_, idx) => {
                                                const xTargets = [155, 205, 255, 305];
                                                const yTargets = [48, 38, 38, 48];
                                                const tx = xTargets[idx] || 230;
                                                const ty = yTargets[idx] || 40;
                                                return (
                                                    <line
                                                        key={`line-pmid-${idx}`}
                                                        x1="230"
                                                        y1="110"
                                                        x2={tx}
                                                        y2={ty + 8}
                                                        stroke="#0284c7"
                                                        strokeOpacity="0.4"
                                                        strokeWidth="1.2"
                                                        strokeDasharray="2 2"
                                                    />
                                                );
                                            })}

                                            {/* Connecting lines from Center to ClinicalTrials nodes */}
                                            {constellationTrials.map((_, idx) => {
                                                const xTargets = [90, 135, 180];
                                                const yTargets = [205, 215, 205];
                                                const tx = xTargets[idx] || 135;
                                                const ty = yTargets[idx] || 210;
                                                return (
                                                    <line
                                                        key={`line-trial-${idx}`}
                                                        x1="210"
                                                        y1="140"
                                                        x2={tx}
                                                        y2={ty - 8}
                                                        stroke="#6366f1"
                                                        strokeOpacity="0.4"
                                                        strokeWidth="1.2"
                                                        strokeDasharray="2 2"
                                                    />
                                                );
                                            })}

                                            {/* Connecting line to OpenFDA */}
                                            {hasRegulatory && (
                                                <line
                                                    x1="250"
                                                    y1="140"
                                                    x2="335"
                                                    y2="197"
                                                    stroke="#14b8a6"
                                                    strokeOpacity="0.4"
                                                    strokeWidth="1.2"
                                                    strokeDasharray="2 2"
                                                />
                                            )}

                                            {/* Center Drug Node */}
                                            <g className="cursor-pointer">
                                                <rect
                                                    x="165"
                                                    y="107"
                                                    width="130"
                                                    height="36"
                                                    rx="8"
                                                    fill="#09090b"
                                                    stroke="#6366f1"
                                                    strokeWidth="1.5"
                                                />
                                                <text
                                                    x="230"
                                                    y="129"
                                                    textAnchor="middle"
                                                    fill="#e0e7ff"
                                                    fontSize="11"
                                                    fontWeight="700"
                                                    fontFamily="monospace"
                                                >
                                                    {centerDrugLabel}
                                                </text>
                                                <title>{`Research Subject: ${extractedDrug}`}</title>
                                            </g>

                                            {/* PubMed Nodes */}
                                            {constellationArticles.map((art, idx) => {
                                                const xTargets = [155, 205, 255, 305];
                                                const yTargets = [48, 38, 38, 48];
                                                const cx = xTargets[idx];
                                                const cy = yTargets[idx];
                                                return (
                                                    <g key={`pmid-node-${art.id || idx}`} className="cursor-pointer group">
                                                        <circle cx={cx} cy={cy} r="7" fill="#082f49" stroke="#38bdf8" strokeWidth="1.5" />
                                                        <circle cx={cx} cy={cy} r="2.5" fill="#bae6fd" />
                                                        <title>{`PubMed • PMID ${art.id}\n${art.title || "No title"}${art.relevance ? `\nRelevance: ${art.relevance}` : ""}`}</title>
                                                    </g>
                                                );
                                            })}
                                            <text x="230" y="20" textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="600" letterSpacing="0.5">
                                                PubMed ({literatureCount})
                                            </text>

                                            {/* ClinicalTrials Nodes */}
                                            {constellationTrials.map((t, idx) => {
                                                const xTargets = [90, 135, 180];
                                                const yTargets = [205, 215, 205];
                                                const cx = xTargets[idx];
                                                const cy = yTargets[idx];
                                                return (
                                                    <g key={`trial-node-${t.trialId || idx}`} className="cursor-pointer group">
                                                        <circle cx={cx} cy={cy} r="7" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.5" />
                                                        <circle cx={cx} cy={cy} r="2.5" fill="#c7d2fe" />
                                                        <title>{`Clinical Trial • ${t.trialId}\n${t.briefTitle || t.title || "No title"}${t.relevance ? `\nRelevance: ${t.relevance}` : ""}`}</title>
                                                    </g>
                                                );
                                            })}
                                            <text x="135" y="240" textAnchor="middle" fill="#818cf8" fontSize="10" fontWeight="600" letterSpacing="0.5">
                                                Trials ({trialsCount})
                                            </text>

                                            {/* OpenFDA Node */}
                                            {hasRegulatory && (
                                                <g className="cursor-pointer group">
                                                    <circle cx="335" cy="205" r="7" fill="#134e4a" stroke="#2dd4bf" strokeWidth="1.5" />
                                                    <circle cx="335" cy="205" r="2.5" fill="#99f6e4" />
                                                    <title>{`OpenFDA • Regulatory Record\nGeneric: ${fdaData.genericName || "N/A"}\nBrand: ${fdaData.brandName || "N/A"}`}</title>
                                                </g>
                                            )}
                                            <text x="335" y="240" textAnchor="middle" fill="#2dd4bf" fontSize="10" fontWeight="600" letterSpacing="0.5">
                                                OpenFDA ({hasRegulatory ? "1" : "0"})
                                            </text>
                                        </svg>
                                        <p className="text-[11px] text-zinc-500 text-center mt-2">
                                            Visualization of retrieved evidence sets. Does not imply biological causal relationships.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="h-48 flex flex-col items-center justify-center text-center p-4 space-y-2">
                                        <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                        </div>
                                        <p className="text-xs font-medium text-zinc-300">Evidence constellation will appear after your first research run</p>
                                        <p className="text-[11px] text-zinc-500 max-w-xs leading-relaxed">
                                            Connected evidence nodes for literature, clinical trials, and regulatory records will be mapped here.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. EVIDENCE INTEGRITY GUARD */}
                        <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 relative overflow-hidden">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-sm font-bold text-white tracking-tight">
                                            Evidence Integrity Guard
                                        </h3>
                                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                                            ACTIVE
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-400">
                                        Generated citations are checked against retrieved evidence before persistence.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    <div className="px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-2">
                                        <span className="text-xs text-zinc-300 font-medium">✓ PMID validation</span>
                                        <span className="text-[10px] font-semibold text-emerald-400 font-mono">ACTIVE</span>
                                    </div>
                                    <div className="px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-2">
                                        <span className="text-xs text-zinc-300 font-medium">✓ NCT validation</span>
                                        <span className="text-[10px] font-semibold text-emerald-400 font-mono">ACTIVE</span>
                                    </div>
                                    <div className="px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-2">
                                        <span className="text-xs text-zinc-300 font-medium">✓ Structured output</span>
                                        <span className="text-[10px] font-semibold text-emerald-400 font-mono">ACTIVE</span>
                                    </div>
                                    <div className="px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-2">
                                        <span className="text-xs text-zinc-300 font-medium">✓ Source verification</span>
                                        <span className="text-[10px] font-semibold text-emerald-400 font-mono">ACTIVE</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 4. RESEARCH GAP EXPLORER */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-tight">
                                    Research Gap Explorer
                                </h2>
                                <p className="text-xs text-zinc-400">
                                    Identify where retrieved evidence is concentrated and where clinical evidence remains limited.
                                </p>
                            </div>
                            <span className="text-[10px] font-mono font-semibold uppercase px-2.5 py-1 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800 self-start sm:self-auto select-none pointer-events-none">
                                RETRIEVED DATASET SCOPE
                            </span>
                        </div>

                        {hasEvidenceData ? (
                            <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 sm:p-8 space-y-6">
                                {/* Desktop 2-column layout, Mobile stacked */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Column: Evidence Distribution + Potential Evidence Gap */}
                                    <div className="space-y-6 flex flex-col justify-between">
                                        {/* Evidence Distribution */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-400" />
                                                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                                                        Evidence Distribution
                                                    </h3>
                                                </div>
                                                <span className="text-[11px] text-zinc-500 font-mono">
                                                    {literatureCount + trialsCount} total records
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                {/* Literature */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-zinc-300 font-medium">Literature</span>
                                                        <span className="font-mono text-sky-400">{literatureCount} records</span>
                                                    </div>
                                                    <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-sky-500 transition-all duration-500"
                                                            style={{ width: `${Math.max(Math.round((literatureCount / maxFingerprintCount) * 100), literatureCount > 0 ? 8 : 0)}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Clinical Trials */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-zinc-300 font-medium">Clinical Trials</span>
                                                        <span className="font-mono text-indigo-400">{trialsCount} records</span>
                                                    </div>
                                                    <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                                                            style={{ width: `${Math.max(Math.round((trialsCount / maxFingerprintCount) * 100), trialsCount > 0 ? 8 : 0)}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Direct Evidence */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-zinc-300 font-medium">Direct Evidence</span>
                                                        <span className="font-mono text-emerald-400">{directCount} records</span>
                                                    </div>
                                                    <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                                            style={{ width: `${Math.max(Math.round((directCount / maxFingerprintCount) * 100), directCount > 0 ? 8 : 0)}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Related Evidence */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-zinc-300 font-medium">Related Evidence</span>
                                                        <span className="font-mono text-amber-400">{relatedCount} records</span>
                                                    </div>
                                                    <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-amber-500 transition-all duration-500"
                                                            style={{ width: `${Math.max(Math.round((relatedCount / maxFingerprintCount) * 100), relatedCount > 0 ? 8 : 0)}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Indirect Evidence */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-zinc-300 font-medium">Indirect Evidence</span>
                                                        <span className="font-mono text-zinc-400">{indirectCount} records</span>
                                                    </div>
                                                    <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-zinc-600 transition-all duration-500"
                                                            style={{ width: `${Math.max(Math.round((indirectCount / maxFingerprintCount) * 100), indirectCount > 0 ? 8 : 0)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Potential Evidence Gap Card */}
                                        <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-3.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                                        Potential Evidence Gap
                                                    </h4>
                                                </div>
                                                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                    DATA-DERIVED GAP
                                                </span>
                                            </div>

                                            <div className="space-y-1.5">
                                                <p className="text-xs font-semibold text-zinc-200 leading-relaxed">
                                                    {gapFindingText}
                                                </p>
                                                <p className="text-xs text-zinc-400 leading-relaxed">
                                                    {gapDetailText}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-850 text-xs font-mono">
                                                <span className="px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-sky-400">
                                                    {directLiteratureCount} Direct Literature
                                                </span>
                                                <span className="px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-indigo-400">
                                                    {directTrialCount} Direct Clinical Trials
                                                </span>
                                                <span className="px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-teal-400">
                                                    {hasRegulatory ? "1" : "0"} Regulatory Record
                                                </span>
                                            </div>

                                            <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-850/80">
                                                <p className="text-[11px] text-zinc-400 leading-relaxed">
                                                    <span className="font-semibold text-zinc-300">NOTE:</span> This describes the retrieved dataset and does not establish absence of evidence globally.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Next Research Question */}
                                    <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 p-6 flex flex-col justify-between space-y-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                                            Next Research Question
                                                        </h4>
                                                        <p className="text-[11px] text-zinc-400">
                                                            Guiding inquiry for follow-up investigation
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                                    RESEARCH NAVIGATION
                                                </span>
                                            </div>

                                            {/* Stylized Question Display */}
                                            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/40 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                                                <div className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold mb-2">
                                                    Formulated Inquiry
                                                </div>
                                                <p className="text-sm sm:text-base font-semibold text-white leading-snug">
                                                    &ldquo;{nextQuestion}&rdquo;
                                                </p>
                                            </div>

                                            {/* Rationale Context */}
                                            <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-850 space-y-1.5">
                                                <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                                                    Observed Evidence Context
                                                </div>
                                                <p className="text-xs text-zinc-300 leading-relaxed">
                                                    {nextQuestionRationale}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Scientific & Research Navigation Notice */}
                                        <div className="p-3.5 rounded-xl bg-zinc-950/50 border border-zinc-850 space-y-1 text-[11px] text-zinc-500 leading-relaxed">
                                            <div className="font-semibold text-zinc-400 flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Scientific Navigation Notice
                                            </div>
                                            <p>
                                                Research-navigation questions are designed to assist exploratory literature review and do not constitute clinical guidance, treatment advice, or efficacy claims.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Full-width Bottom Notice */}
                                <div className="pt-4 border-t border-zinc-900 flex items-center gap-2 text-xs text-amber-400/90 font-medium">
                                    <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span>
                                        Based on retrieved evidence only. Does not establish absence of evidence globally.
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <div className="space-y-1 max-w-sm">
                                    <h3 className="text-sm font-semibold text-zinc-200">Research Gap Explorer</h3>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        Run a research investigation to analyze the retrieved evidence landscape.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 5. AGENT PIPELINE VISUAL (STATIC ARCHITECTURAL OVERVIEW) */}
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">
                                Research Pipeline
                            </h2>
                            <p className="text-xs text-zinc-400">
                                Architectural workflow: multi-agent retrieval, deterministic aggregation, and structured synthesis
                            </p>
                        </div>

                        <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-6 sm:p-8 space-y-6">
                            {/* Pipeline Step Sequence */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Step 1 */}
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-2 relative">
                                    <div className="text-[11px] font-mono text-indigo-400 font-semibold">STAGE 01</div>
                                    <h4 className="text-sm font-semibold text-white">Query Parser</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        Extracts drug/disease entities and expands synonym dictionaries.
                                    </p>
                                </div>

                                {/* Step 2 */}
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-2 relative">
                                    <div className="text-[11px] font-mono text-indigo-400 font-semibold">STAGE 02</div>
                                    <h4 className="text-sm font-semibold text-white">Master Agent</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        Orchestrates PubMed, ClinicalTrials, OpenFDA & Market agents in parallel.
                                    </p>
                                </div>

                                {/* Step 3 */}
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-2 relative">
                                    <div className="text-[11px] font-mono text-indigo-400 font-semibold">STAGE 03</div>
                                    <h4 className="text-sm font-semibold text-white">Gemini 2.5 Flash</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        Produces 12-field structured scientific report strictly from retrieved data.
                                    </p>
                                </div>

                                {/* Step 4 */}
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-2 relative">
                                    <div className="text-[11px] font-mono text-indigo-400 font-semibold">STAGE 04</div>
                                    <h4 className="text-sm font-semibold text-white">Citation Validation & PDF</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed">
                                        Validates narrative PMIDs/NCTs, saves to MySQL, and renders scientific PDF.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. RECENT RESEARCH & ACCOUNT STATS */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-white tracking-tight">
                                    Recent Research
                                </h2>
                                <p className="text-xs text-zinc-400">
                                    Your previously generated drug repurposing investigations
                                </p>
                            </div>

                            {recentReports.length > 0 && (
                                <button
                                    onClick={() => router.push("/history")}
                                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                                >
                                    View All History →
                                </button>
                            )}
                        </div>

                        {loadingHistory ? (
                            <div className="flex items-center gap-3 text-zinc-500 py-8">
                                <div className="w-4 h-4 border-2 border-zinc-800 border-t-indigo-500 rounded-full animate-spin" />
                                <span className="text-xs">Loading recent research...</span>
                            </div>
                        ) : recentReports.length === 0 ? (
                            /* Polished Empty State */
                            <div className="bg-zinc-950 border border-zinc-850 rounded-2xl p-10 text-center space-y-3">
                                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-semibold text-white">No research yet</h3>
                                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                                    Run your first drug repurposing investigation above to generate an evidence-backed report.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {recentReports.map((item) => (
                                    <div
                                        key={item.id}
                                        className="bg-zinc-950 border border-zinc-850 hover:border-zinc-750 rounded-xl p-5 flex flex-col justify-between space-y-4 transition group"
                                    >
                                        <div className="space-y-2">
                                            <div className="text-[11px] font-mono text-zinc-500">
                                                {new Date(item.createdAt).toLocaleDateString(undefined, {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </div>
                                            <h4 className="text-sm font-semibold text-white line-clamp-1 group-hover:text-indigo-300 transition">
                                                {item.title}
                                            </h4>
                                            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                                                {item.summary || "Evidence synthesis report available."}
                                            </p>
                                        </div>

                                        <div className="pt-2 border-t border-zinc-900 flex items-center justify-between">
                                            <button
                                                onClick={() => router.push(`/history/${item.id}`)}
                                                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                                            >
                                                View Report →
                                            </button>
                                            {item.pdfUrl && (
                                                <a
                                                    href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${item.pdfUrl}?token=${token}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[11px] text-zinc-500 hover:text-zinc-300 transition"
                                                >
                                                    PDF
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    );
}