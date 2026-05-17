import { Response } from "express";

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