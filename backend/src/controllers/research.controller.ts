import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";
import { env } from "../config/env";
import { generateResearchPDF } from "../services/pdf.service";

import { asyncHandler } from "../utils/asyncHandler";
import { apiResponse } from "../utils/apiResponse";

import {
    generateResearchService,
    getSingleReportService,
    getUserReportsService,
} from "../services/research.service";

import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const generateResearch = asyncHandler(
    async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        const { query } = req.body;

        const userId = req.user?.userId;

        const researchData =
            await generateResearchService(
                query,
                userId as string
            );

        res.status(200).json(
            apiResponse(
                true,
                "Research generated successfully",
                researchData
            )
        );
    }
);

export const getUserReports = asyncHandler(
    async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        const userId = req.user?.userId;

        const reports =
            await getUserReportsService(
                userId as string
            );

        res.status(200).json(
            apiResponse(
                true,
                "Reports fetched successfully",
                reports
            )
        );
    }
);

export const getSingleReport = asyncHandler(
    async (
        req: AuthenticatedRequest,
        res: Response
    ) => {
        const userId = req.user?.userId;

        const reportId =
            req.params.id as string;

        const report =
            await getSingleReportService(
                reportId,
                userId as string
            );

        if (!report) {
            res.status(404).json(
                apiResponse(
                    false,
                    "Report not found",
                    null
                )
            );

            return;
        }

        res.status(200).json(
            apiResponse(
                true,
                "Report fetched successfully",
                report
            )
        );
    }
);

export const downloadReportPDF = asyncHandler(
    async (
        req: Request,
        res: Response
    ) => {
        // Retrieve token from Authorization header or token query parameter
        const authHeader = req.headers.authorization;
        let token = "";
        if (authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1];
        } else if (req.query.token) {
            token = req.query.token as string;
        }

        if (!token) {
            res.status(401).json(apiResponse(false, "Unauthorized: Missing token", null));
            return;
        }

        let userId = "";
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
            userId = decoded.userId;
        } catch (error) {
            res.status(401).json(apiResponse(false, "Unauthorized: Invalid token", null));
            return;
        }

        const reportId = req.params.id as string;

        // Fetch report and verify ownership
        const report = await getSingleReportService(reportId, userId);

        if (!report) {
            res.status(404).json(apiResponse(false, "Report not found or access denied", null));
            return;
        }

        const fileName = `report-${reportId}.pdf`;
        const filePath = path.join(process.cwd(), "uploads", "reports", fileName);

        const reqId = Math.random().toString(36).substring(7);
        console.time(`[Telemetry] [${reqId}] generateResearchPDF (on-demand)`);
        // Check if PDF file exists on disk
        if (!fs.existsSync(filePath)) {
            // Ensure uploads/reports folder exists
            const reportsDir = path.dirname(filePath);
            if (!fs.existsSync(reportsDir)) {
                fs.mkdirSync(reportsDir, { recursive: true });
            }

            // Generate on-demand
            await generateResearchPDF(reportId, report.title, report.aiInsights, report);
        }
        console.timeEnd(`[Telemetry] [${reqId}] generateResearchPDF (on-demand)`);

        // Stream file download
        res.download(filePath, `${report.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
    }
);