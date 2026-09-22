import { Router } from "express";

import { env } from "../config/env";
import healthRoutes from "./health.routes";
import testRoutes from "./test.routes";
import authRoutes from "./auth.routes";
import protectedRoutes from "./protected.routes";
import researchRoutes from "./research.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/protected", protectedRoutes);
router.use("/research", researchRoutes);

// Test routes are development-only; never exposed in production
if (env.NODE_ENV !== "production") {
    router.use("/test-db", testRoutes);
}

export default router;