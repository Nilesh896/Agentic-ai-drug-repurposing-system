const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Fetching research reports...");
        const reports = await prisma.researchReport.findMany({
            select: {
                id: true,
                title: true,
                createdAt: true,
                pdfUrl: true,
                user: {
                    select: {
                        email: true
                    }
                }
            }
        });
        console.log("Reports in database:", JSON.stringify(reports, null, 2));
    } catch (error) {
        console.error("Database query failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
