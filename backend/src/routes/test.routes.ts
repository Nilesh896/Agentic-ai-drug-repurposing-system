import { Router, Request, Response, NextFunction } from "express";
import { testDatabaseConnection } from "../controllers/test.controller";
import { env } from "../config/env";

const router = Router();

// Development-only guard: block all test endpoints in production
router.use((_req: Request, res: Response, next: NextFunction) => {
    if (env.NODE_ENV === "production") {
        return res.status(404).json({
            success: false,
            message: "Test routes are disabled in production environment.",
        });
    }
    next();
});

router.get("/", testDatabaseConnection);

export default router;