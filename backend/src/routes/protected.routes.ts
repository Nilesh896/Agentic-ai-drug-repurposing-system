import { Router } from "express";

import {
    authenticateUser,
    AuthenticatedRequest,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
    "/",
    authenticateUser,
    (req: AuthenticatedRequest, res) => {
        res.status(200).json({
            success: true,
            message: "Protected route accessed",
            user: req.user,
        });
    }
);

export default router;