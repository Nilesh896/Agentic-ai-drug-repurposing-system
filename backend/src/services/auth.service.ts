import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

import {
    LoginUserInput,
    RegisterUserInput,
} from "../types/auth.types";

export const registerUserService = async (
    data: RegisterUserInput
) => {
    if (!data.name || data.name.trim() === "") {
        throw new ApiError(400, "Name cannot be empty");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        throw new ApiError(400, "Invalid email format");
    }

    if (!data.password || data.password.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters long");
    }

    const existingUser = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });

    if (existingUser) {
        throw new ApiError(400, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
        },
    });

    // Strip password hash from return payload to keep security clean
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
};

export const loginUserService = async (
    data: LoginUserInput
) => {
    const user = await prisma.user.findUnique({
        where: {
            email: data.email,
        },
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await bcrypt.compare(
        data.password,
        user.password
    );

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid credentials");
    }

    const token = jwt.sign(
        {
            userId: user.id,
        },
        env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
        },
    };
};