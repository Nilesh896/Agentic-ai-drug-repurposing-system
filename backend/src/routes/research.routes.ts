import { Router } from "express";

import {
    generateResearch,
    getSingleReport,
    getUserReports,
} from "../controllers/research.controller";

import { authenticateUser } from "../middleware/auth.middleware";

const router = Router();

router.post(
    "/generate",
    authenticateUser,
    generateResearch
);

router.get(
    "/history",
    authenticateUser,
    getUserReports
);

router.get(
    "/:id",
    authenticateUser,
    getSingleReport
);

export default router;