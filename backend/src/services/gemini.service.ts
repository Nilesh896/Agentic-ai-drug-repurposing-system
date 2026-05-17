import { GoogleGenerativeAI } from "@google/generative-ai";

import { env } from "../config/env";

const genAI = new GoogleGenerativeAI(
    env.GEMINI_API_KEY
);

export const generateAIResearchReport = async (
    query: string,
    researchData: any
) => {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

        const simplifiedData = {
            literatureData: researchData.literatureData,
            clinicalTrialData:
                researchData.clinicalTrialData,
            drugInfoData: {
                source: researchData.drugInfoData.source,
                message:
                    researchData.drugInfoData.message,
                drugData: researchData.drugInfoData
                    .drugData
                    ? {
                        brandName:
                            researchData.drugInfoData
                                .drugData.brandName,

                        genericName:
                            researchData.drugInfoData
                                .drugData.genericName,

                        manufacturer:
                            researchData.drugInfoData
                                .drugData.manufacturer,
                    }
                    : null,
            },
            marketData: researchData.marketData,
        };

        const summaryPrompt = `
You are an expert pharmaceutical AI analyst. Generate a highly professional, scientific research summary.
Length: 400-700 words.

Query: ${query}

Research Data:
${JSON.stringify(simplifiedData, null, 2)}

INSTRUCTIONS:
- Write in a highly analytical, human-quality, publication-ready tone.
- FORBIDDEN: "it is important to note", "overall", "in conclusion", robotic sentence patterns.
- Use clean markdown (only # Heading, ## Subheading). Use short paragraphs for readability.

Generate these sections exactly:

## Executive Summary
(Overview of findings and core hypothesis)

## Key Findings
(Most significant data points and implications)

## Clinical Insight
(Clinical trial data, mechanisms, and translational potential)

## Conclusion
(Primary takeaways and final clinical judgement)
`;

        const fullReportPrompt = `
You are an expert pharmaceutical AI analyst. Generate a professional scientific research report.
Length: 1500-2500 words.

Query: ${query}

Research Data:
${JSON.stringify(simplifiedData, null, 2)}

INSTRUCTIONS:
- Write detailed, robust paragraphs. No section under 100 words.
- Write in a highly analytical, human-quality, publication-ready tone.
- FORBIDDEN: "it is important to note", "overall", "in conclusion", robotic sentence patterns.
- Use short paragraphs and proper spacing to avoid text walls.
- Use CLEAN markdown only (# Heading). Avoid bullet spam. Rely on detailed scientific prose.

Generate these sections exactly:

# Executive Summary
(Comprehensive overview of drug, disease, and repurposing rationale)

# Disease Background
(Pathophysiology and unmet medical needs)

# Drug Overview
(Profile, pharmacokinetics, and original indication)

# Mechanism of Action
(Scientific explanation of target interactions)

# Literature Review
(Synthesize findings from scientific literature and preclinical models)

# Clinical Insights
(Analyze available clinical trial data, populations, and outcomes)

# Safety Analysis
(Drug safety profile, adverse events, and contraindications)

# Market Potential
(Market size, pricing, and competitive landscape)

# Challenges
(Scientific, clinical, and commercial barriers)

# Conclusion
(Definitive scientific and commercial verdict on the hypothesis)

# References
(Provide highly realistic, PubMed-style structured scientific citations. Do NOT use fake markdown bullets or incomplete links. Format like real academic papers.)
`;

        const [summaryResult, fullReportResult] = await Promise.all([
            model.generateContent(summaryPrompt),
            model.generateContent(fullReportPrompt),
        ]);

        return {
            summary: summaryResult.response.text(),
            fullReport: fullReportResult.response.text(),
        };
    } catch (error: any) {
        console.error(
            "Gemini AI Error FULL:",
            JSON.stringify(error, null, 2)
        );

        return {
            summary: `Unable to generate full AI report for "${query}" at the moment. Please retry.`,
            fullReport: `Unable to generate full AI report for "${query}" at the moment. Please retry.`,
        };
    }
};