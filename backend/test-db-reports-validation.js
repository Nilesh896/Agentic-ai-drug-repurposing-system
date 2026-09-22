const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Fetching the latest research report...");
        const report = await prisma.researchReport.findFirst({
            orderBy: {
                createdAt: "desc"
            }
        });
        
        if (!report) {
            console.log("No reports found in the database.");
            return;
        }

        console.log("Latest report retrieved successfully:");
        console.log("- ID:", report.id);
        console.log("- Title:", report.title);
        console.log("- PDF URL:", report.pdfUrl);
        console.log("- Summary type:", typeof report.summary);
        console.log("- Summary length (chars):", report.summary?.length);
        console.log("- aiInsights type:", typeof report.aiInsights);
        console.log("- aiInsights length (chars):", report.aiInsights?.length);
        
        if (typeof report.summary === "string" && report.summary.length > 0) {
            console.log("SUCCESS: Summary is a valid populated string.");
        } else {
            console.log("FAIL: Summary is not a valid populated string.");
        }

        if (typeof report.aiInsights === "string" && report.aiInsights.length > 0) {
            console.log("SUCCESS: aiInsights is a valid populated string.");
        } else {
            console.log("FAIL: aiInsights is not a valid populated string.");
        }
    } catch (error) {
        console.error("Verification script failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
