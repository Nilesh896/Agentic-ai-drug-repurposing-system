import dotenv from "dotenv";

dotenv.config();

export const env = {
    PORT: process.env.PORT || 5000,

    JWT_SECRET:
        process.env.JWT_SECRET || "supersecretkey",

    DATABASE_URL:
        process.env.DATABASE_URL || "",

    GEMINI_API_KEY:
        process.env.GEMINI_API_KEY || "",
};