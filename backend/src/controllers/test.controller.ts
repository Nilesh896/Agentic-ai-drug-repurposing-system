import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const testDatabaseConnection = async (
    _req: Request,
    res: Response
) => {
    const users = await prisma.user.findMany();

    res.status(200).json({
        success: true,
        users,
    });
};