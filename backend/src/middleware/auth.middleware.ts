import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

interface JwtPayload {
    userId: string;
}

export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}

export const authenticateUser = (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new ApiError(401, "Unauthorized");
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(
            token,
            env.JWT_SECRET
        ) as JwtPayload;

        req.user = decoded;

        next();
    } catch (error) {
        throw new ApiError(401, "Invalid token");
    }
};