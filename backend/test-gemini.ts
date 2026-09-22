import { generateAIResearchReport } from "./src/services/gemini.service";

async function main() {
    const query = "Ibuprofen";
    const mockResearchData = {
        literatureData: {
            source: "PubMed",
            totalArticles: 1,
            articles: [
                {
                    id: "12345",
                    title: "Test Ibuprofen Efficacy",
                    authors: ["Jane Doe"],
                    publishDate: "2023",
                    source: "Test Journal"
                }
            ]
        },
        clinicalTrialData: {
            source: "ClinicalTrials.gov",
            totalTrials: 1,
            message: "Clinical trials fetched successfully",
            trials: [
                {
                    trialId: "NCT00000000",
                    title: "Test Trial",
                    status: "COMPLETED",
                    phase: "PHASE3",
                    condition: "Inflammation"
                }
            ]
        },
        drugInfoData: {
            source: "OpenFDA",
            message: "Drug information fetched successfully",
            drugData: {
                brandName: "Ibuprofen Brand",
                genericName: "IBUPROFEN",
                manufacturer: "Test Pharma",
                purpose: "Pain reliever",
                indicationsAndUsage: "Indicated for pain relief.",
                adverseReactions: "No adverse reactions available"
            }
        },
        marketData: {
            source: "Market Intelligence",
            marketPotential: "High potential in repurposing market.",
            patentStatus: "Some related patents identified."
        }
    };

    console.log(`--- Testing Gemini AI Service for query: "${query}" ---`);
    try {
        const report = await generateAIResearchReport(query, mockResearchData);
        console.log("Gemini response returned successfully.");
        console.log("Summary report length:", report.summary.length);
        console.log("Full report length:", report.fullReport.length);
        console.log("Summary Sample (First 200 chars):\n", report.summary.slice(0, 200));
    } catch (e) {
        console.error("Gemini service failed with error:", e);
    }
}

main();
