const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Connecting to database...");
        const users = await prisma.user.findMany();
        console.log("Connection successful!");
        console.log("Users in database:", users);
    } catch (error) {
        console.error("Database connection failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
