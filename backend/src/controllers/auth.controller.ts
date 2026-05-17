import { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler";
import { apiResponse } from "../utils/apiResponse";

import {
    loginUserService,
    registerUserService,
} from "../services/auth.service";

export const registerUser = asyncHandler(
    async (req: Request, res: Response) => {
        const user = await registerUserService(req.body);

        res.status(201).json(
            apiResponse(true, "User registered successfully", user)
        );
    }
);

export const loginUser = asyncHandler(
    async (req: Request, res: Response) => {
        const data = await loginUserService(req.body);

        res.status(200).json(
            apiResponse(true, "Login successful", data)
        );
    }
);