import { Router } from "express";

import healthRoutes from "./health.routes";
import testRoutes from "./test.routes";
import authRoutes from "./auth.routes";
import protectedRoutes from "./protected.routes";
import researchRoutes from "./research.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/test-db", testRoutes);
router.use("/auth", authRoutes);
router.use("/protected", protectedRoutes);
router.use("/research", researchRoutes);

export default router;