import { masterAgent } from "../agents/master.agent";
import { prisma } from "../lib/prisma";
import { generateAIResearchReport } from "./gemini.service";
import { parseQuery } from "../utils/queryParser";

export const generateResearchService = async (
    query: string,
    userId: string
) => {
    const reqId = Math.random().toString(36).substring(7);
    const t0Total = Date.now();
    console.log(`[Research Service] [${reqId}] Starting research generation for user "${userId}" with query: "${query}"`);
    console.time(`[Telemetry] [${reqId}] generateResearchService Total`);

    console.log(`[Research Service] [${reqId}] Parsing search query...`);
    console.time(`[Telemetry] [${reqId}] parseQuery`);
    const parsedQuery = parseQuery(query);
    console.timeEnd(`[Telemetry] [${reqId}] parseQuery`);
    console.log(`[Research Service] [${reqId}] Query parsed. Drug: "${parsedQuery.drugName}", Disease: "${parsedQuery.diseaseName}"`);

    console.log(`[Research Service] [${reqId}] Invoking masterAgent parallel data fetch...`);
    console.time(`[Telemetry] [${reqId}] masterAgent parallel fetch`);
    const aggregatedData = await masterAgent(parsedQuery);
    console.timeEnd(`[Telemetry] [${reqId}] masterAgent parallel fetch`);
    console.log(`[Research Service] [${reqId}] MasterAgent fetch completed. PubMed articles: ${aggregatedData.literatureData?.articles?.length || 0}, Trials: ${aggregatedData.clinicalTrialData?.trials?.length || 0}`);

    console.log(`[Research Service] [${reqId}] Generating AI synthesis report with Gemini...`);
    console.time(`[Telemetry] [${reqId}] generateAIResearchReport`);
    const aiReportResult = await generateAIResearchReport(
        query,
        aggregatedData,
        reqId
    );
    console.timeEnd(`[Telemetry] [${reqId}] generateAIResearchReport`);
    console.log(`[Research Service] [${reqId}] Gemini synthesis successfully completed.`);

    // Provide safe fallback for old string returns
    const summaryText = typeof aiReportResult === 'string' ? (aiReportResult as string).slice(0, 800) : aiReportResult.summary;
    const fullReportText = typeof aiReportResult === 'string' ? aiReportResult : (aiReportResult.fullReport || aiReportResult.summary);
    const aiInsightsData = typeof aiReportResult === 'object' && aiReportResult?.structured
        ? JSON.stringify(aiReportResult.structured)
        : fullReportText;

    console.time(`[Telemetry] [${reqId}] DB Operations`);
    const researchQuery = await prisma.researchQuery.create({
        data: {
            query,
            drugName: parsedQuery.drugName,
            userId,
        },
    });

    const report = await prisma.researchReport.create({
        data: {
            title: `Research Report for ${query}`,

            summary: summaryText,

            literatureData: aggregatedData.literatureData,

            clinicalTrialData: aggregatedData.clinicalTrialData,

            drugInfoData: aggregatedData.drugInfoData,

            marketData: aggregatedData.marketData,

            aiInsights: aiInsightsData,

            userId,

            researchQueryId: researchQuery.id,

            // Decouple PDF generation: set to dynamic route path instead of local file path
            pdfUrl: `/api/v1/research/reports/${researchQuery.id}/pdf`,
        },
    });
    console.timeEnd(`[Telemetry] [${reqId}] DB Operations`);

    console.timeEnd(`[Telemetry] [${reqId}] generateResearchService Total`);

    // Force updates to the database record so the pdfUrl maps to the report's actual UUID
    const finalReport = await prisma.researchReport.update({
        where: { id: report.id },
        data: {
            pdfUrl: `/api/v1/research/reports/${report.id}/pdf`,
        },
    });

    console.log(`[Telemetry] total research generation time: ${Date.now() - t0Total}ms`);

    return {
        ...aggregatedData,
        aiReport: fullReportText,
        savedReport: finalReport,
    };
};
export const getUserReportsService = async (
    userId: string
) => {
    const reports =
        await prisma.researchReport.findMany({
            where: {
                userId,
            },

            orderBy: {
                createdAt: "desc",
            },

            select: {
                id: true,
                title: true,
                summary: true,
                pdfUrl: true,
                createdAt: true,
            },
        });

    return reports;
};

export const getSingleReportService = async (
    reportId: string,
    userId: string
) => {
    const report =
        await prisma.researchReport.findFirst({
            where: {
                id: reportId,
                userId,
            },
        });

    return report;
};