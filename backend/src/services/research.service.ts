import { masterAgent } from "../agents/master.agent";

import { prisma } from "../lib/prisma";

import { generateAIResearchReport } from "./gemini.service";
import { generateResearchPDF } from "./pdf.service";

export const generateResearchService = async (
    query: string,
    userId: string
) => {
    const aggregatedData =
        await masterAgent(query);

    const aiReportResult =
        await generateAIResearchReport(
            query,
            aggregatedData
        );

    // Provide safe fallback for old string returns
    const summaryText = typeof aiReportResult === 'string' ? (aiReportResult as string).slice(0, 800) : aiReportResult.summary;
    const fullReportText = typeof aiReportResult === 'string' ? aiReportResult : aiReportResult.fullReport;

    const researchQuery =
        await prisma.researchQuery.create({
            data: {
                query,
                drugName: query,
                userId,
            },
        });

    const report =
        await prisma.researchReport.create({
            data: {
                title: `Research Report for ${query}`,

                summary: summaryText,

                literatureData:
                    aggregatedData.literatureData,

                clinicalTrialData:
                    aggregatedData.clinicalTrialData,

                drugInfoData:
                    aggregatedData.drugInfoData,

                marketData:
                    aggregatedData.marketData,

                aiInsights: fullReportText,

                userId,

                researchQueryId:
                    researchQuery.id,
            },
        });

    const pdfUrl =
        await generateResearchPDF(
            report.id,
            query,
            fullReportText
        );

    const updatedReport =
        await prisma.researchReport.update({
            where: {
                id: report.id,
            },
            data: {
                pdfUrl,
            },
        });

    return {
        ...aggregatedData,
        aiReport: typeof aiReportResult === 'string' ? aiReportResult : aiReportResult.summary,
        savedReport: updatedReport,
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