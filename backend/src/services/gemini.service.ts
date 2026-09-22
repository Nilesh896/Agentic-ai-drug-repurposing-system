import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export interface StructuredReport {
    summary: string;
    researchQuestion: string;
    evidenceOverview: string;
    literatureEvidence: string;
    clinicalTrialEvidence: string;
    drugOverview: string;
    diseaseOverview: string;
    repurposingRationale: string;
    safety: string;
    assessment: string;
    limitations: string;
    conclusion: string;
}

export const REQUIRED_REPORT_FIELDS: (keyof StructuredReport)[] = [
    "summary",
    "researchQuestion",
    "evidenceOverview",
    "literatureEvidence",
    "clinicalTrialEvidence",
    "drugOverview",
    "diseaseOverview",
    "repurposingRationale",
    "safety",
    "assessment",
    "limitations",
    "conclusion",
];

export const formatStructuredReportToMarkdown = (s: StructuredReport): string => {
    return [
        `# Research Question\n\n${s.researchQuestion.trim()}`,
        `# Executive Summary\n\n${s.summary.trim()}`,
        `# Evidence Overview\n\n${s.evidenceOverview.trim()}`,
        `# Literature Evidence\n\n${s.literatureEvidence.trim()}`,
        `# Clinical Trial Evidence\n\n${s.clinicalTrialEvidence.trim()}`,
        `# Drug Overview\n\n${s.drugOverview.trim()}`,
        `# Target Disease Overview\n\n${s.diseaseOverview.trim()}`,
        `# Repurposing Rationale\n\n${s.repurposingRationale.trim()}`,
        `# Safety & Contraindications\n\n${s.safety.trim()}`,
        `# Repurposing Assessment\n\n${s.assessment.trim()}`,
        `# Limitations\n\n${s.limitations.trim()}`,
        `# Conclusion\n\n${s.conclusion.trim()}`,
    ].join("\n\n");
};

export const generateAIResearchReport = async (
    query: string,
    researchData: any,
    reqId?: string
) => {
    const logScope = reqId ? `[Gemini Service] [${reqId}]` : `[Gemini Service]`;
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                maxOutputTokens: 6000,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        summary: { type: "STRING" },
                        researchQuestion: { type: "STRING" },
                        evidenceOverview: { type: "STRING" },
                        literatureEvidence: { type: "STRING" },
                        clinicalTrialEvidence: { type: "STRING" },
                        drugOverview: { type: "STRING" },
                        diseaseOverview: { type: "STRING" },
                        repurposingRationale: { type: "STRING" },
                        safety: { type: "STRING" },
                        assessment: { type: "STRING" },
                        limitations: { type: "STRING" },
                        conclusion: { type: "STRING" }
                    },
                    required: [
                        "summary",
                        "researchQuestion",
                        "evidenceOverview",
                        "literatureEvidence",
                        "clinicalTrialEvidence",
                        "drugOverview",
                        "diseaseOverview",
                        "repurposingRationale",
                        "safety",
                        "assessment",
                        "limitations",
                        "conclusion"
                    ]
                } as any
            }
        });

        // Map to compact AI context payload
        const articles = researchData.literatureData?.articles || [];
        const trials = researchData.clinicalTrialData?.trials || [];

        const compactArticles = articles.map((art: any) => {
            const yearMatch = art.publishDate?.match(/\b(19\d\d|20\d\d)\b/);
            return {
                pmid: art.id || "N/A",
                title: art.title || "No Title",
                year: yearMatch ? yearMatch[1] : "N/A",
                relevance: art.relevance || "RELATED",
                excerpt: art.abstract ? art.abstract.substring(0, 240) : "No abstract available."
            };
        });

        const compactTrials = trials.map((t: any) => ({
            nctId: t.trialId || "N/A",
            title: t.briefTitle || t.title || "No Title",
            status: t.status || "UNKNOWN",
            phase: t.phase || "N/A",
            relevance: t.relevance || "RELATED",
            summary: t.briefSummary ? t.briefSummary.substring(0, 160) : "No summary available.",
            interventions: (t.interventions || []).map((i: any) => i.name).filter(Boolean).slice(0, 2).join(", "),
            outcomes: (t.primaryOutcomes || []).map((o: any) => o.measure).filter(Boolean).slice(0, 2).join("; ")
        }));

        const fda = researchData.drugInfoData?.drugData;
        const fdaData = fda ? {
            genericName: fda.genericName || "N/A",
            brandName: fda.brandName || "N/A",
            indications: fda.indicationsAndUsage ? fda.indicationsAndUsage.substring(0, 220) : "N/A",
            adverseReactions: fda.adverseReactions ? fda.adverseReactions.substring(0, 220) : "N/A"
        } : null;

        const compactData = {
            literature: compactArticles,
            trials: compactTrials,
            fda: fdaData,
            market: researchData.marketData ? "Market simulation data (MOCK / UNVERIFIED)" : null
        };

        const unifiedPrompt = `
You are an expert biomedical research analyst. Synthesize the retrieved evidence into the required structured JSON response.

Query: ${query}

EVIDENCE DATA:
${JSON.stringify(compactData)}

OUTPUT CONTRACT:
Return ONLY valid JSON matching the schema. All 12 fields are required. Keep each field concise and scientific.
Approximate word targets:
- summary: 100–150 words
- researchQuestion: 40–70
- evidenceOverview: 70–110
- literatureEvidence: 120–170
- clinicalTrialEvidence: 120–170
- drugOverview: 70–110
- diseaseOverview: 70–110
- repurposingRationale: 90–140
- safety: 90–140
- assessment: 90–140
- limitations: 60–90
- conclusion: 60–90

SCIENTIFIC RULES:
1. Grounding: Cite ONLY PMIDs and NCT IDs present in the evidence ([PMID: XXXXX], [NCT: XXXXX]). Never invent citations, outcomes, or regulatory facts.
2. Evidence Distinction: Clearly distinguish randomized from observational evidence, and efficacy from safety/toxicity.
3. Key Findings: If PMID 38762798 (ASTER) is present, accurately state IV acetaminophen did NOT improve days alive and free of organ support in sepsis patients vs placebo.
4. Absence of Evidence: Preserve DIRECT/RELATED/INDIRECT classifications. For unevidenced aspects, state: "No directly relevant evidence was identified in the retrieved dataset."
5. Context: OpenFDA label data reflects approved indications/safety, not repurposing proof. Market data is simulation only; label as "Market Intelligence: MOCK / UNVERIFIED" and do not treat as clinical evidence.
6. Scope: Narrative synthesis only. Do not generate markdown tables, charts, or publication lists.
`;

        const reqStartTime = new Date().toISOString();
        console.log(`[Telemetry] Gemini request start: ${reqStartTime}`);
        const t0Gemini = Date.now();
        let result: any;
        try {
            result = await model.generateContent(unifiedPrompt);
        } catch (apiError: any) {
            console.error(`[Telemetry] Gemini HTTP/API error status: ${apiError.status || apiError.statusCode || 'N/A'}`);
            console.error(`[Telemetry] Gemini API error message: ${apiError.message || apiError}`);
            throw apiError;
        }
        const t1Gemini = Date.now();
        const reqEndTime = new Date().toISOString();
        console.log(`[Telemetry] Gemini response received: ${reqEndTime}`);
        console.log(`[Telemetry] Gemini response duration: ${t1Gemini - t0Gemini}ms`);

        // Inspect candidate finish reason BEFORE parsing
        const candidate = result.response?.candidates?.[0];
        const finishReason = candidate?.finishReason;
        const usage = result.response?.usageMetadata;
        console.log(`[Telemetry] Gemini finishReason: ${finishReason || 'N/A'}`);
        if (usage) {
            console.log(`[Telemetry] Gemini token usage - prompt: ${usage.promptTokenCount}, candidates: ${usage.candidatesTokenCount}, total: ${usage.totalTokenCount}`);
        }

        if (finishReason === "MAX_TOKENS") {
            console.error(`${logScope} Gemini response truncated due to MAX_TOKENS limit.`);
            throw new Error("Gemini response truncated before completing structured JSON (finishReason: MAX_TOKENS).");
        }

        if (finishReason && finishReason !== "STOP") {
            console.error(`${logScope} Gemini response finished with abnormal reason: ${finishReason}`);
            throw new Error(`Gemini response stopped abnormally (finishReason: ${finishReason}).`);
        }

        const rawText = result.response.text();
        const text = (rawText || "").trim();
        console.log(`[Telemetry] Gemini response character/token length if available: ${text.length} characters`);

        // Check if response is incomplete before JSON.parse
        if (!text.endsWith("}")) {
            console.error(`${logScope} Gemini response is truncated (missing closing brace). Length: ${text.length}`);
            throw new Error("Gemini response truncated before completing structured JSON.");
        }

        let structuredReport: StructuredReport;

        // Parse JSON Schema output safely and validate all 12 required fields
        try {
            const cleanText = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
            const parsed = JSON.parse(cleanText);

            for (const field of REQUIRED_REPORT_FIELDS) {
                if (
                    !parsed[field] ||
                    typeof parsed[field] !== "string" ||
                    parsed[field].trim().length === 0
                ) {
                    throw new Error(`Parsed JSON object is missing required non-empty field: '${field}'.`);
                }
            }

            structuredReport = {
                summary: parsed.summary.trim(),
                researchQuestion: parsed.researchQuestion.trim(),
                evidenceOverview: parsed.evidenceOverview.trim(),
                literatureEvidence: parsed.literatureEvidence.trim(),
                clinicalTrialEvidence: parsed.clinicalTrialEvidence.trim(),
                drugOverview: parsed.drugOverview.trim(),
                diseaseOverview: parsed.diseaseOverview.trim(),
                repurposingRationale: parsed.repurposingRationale.trim(),
                safety: parsed.safety.trim(),
                assessment: parsed.assessment.trim(),
                limitations: parsed.limitations.trim(),
                conclusion: parsed.conclusion.trim(),
            };
            console.log(`[Telemetry] JSON parsing success/failure: success - all 12 required fields validated`);
        } catch (jsonErr: any) {
            console.error(`[Telemetry] JSON parsing success/failure: failure - ${jsonErr.message}`);
            throw new Error(`Failed to parse structured JSON from Gemini response: ${jsonErr.message}`);
        }

        // Narrative citation validation: ensure all cited PMIDs/NCTs exist in retrieved evidence
        validateNarrativeCitations(structuredReport, researchData, logScope);

        const fullReport = formatStructuredReportToMarkdown(structuredReport);

        return {
            summary: structuredReport.summary,
            fullReport,
            structured: structuredReport,
        };
    } catch (error: any) {
        console.error(`${logScope} Generation failed:`, error.message || error);
        throw error;
    }
};

/**
 * Validates that all narrative PMID and NCT citations generated by Gemini
 * are strictly present in the actual retrieved evidence datasets.
 *
 * Rules:
 * 1. PMID references are validated ONLY against retrieved PubMed PMIDs.
 * 2. NCT references are validated ONLY against retrieved ClinicalTrials.gov NCT IDs.
 * 3. Does not modify, guess, or repair invalid identifiers.
 * 4. Fails safely by throwing an error if an unsupported identifier is found.
 */
export const validateNarrativeCitations = (
    report: StructuredReport,
    researchData: any,
    logScope: string = "[Gemini Service]"
): void => {
    // 1. Build retrieved identifier sets from actual retrieved evidence
    const articles = researchData?.literatureData?.articles || [];
    const trials = researchData?.clinicalTrialData?.trials || [];

    const retrievedPubMedPmids = new Set<string>();
    for (const art of articles) {
        const rawId = String(art.id || art.pmid || "").trim();
        if (rawId && rawId !== "N/A") {
            retrievedPubMedPmids.add(rawId);
            const numericId = rawId.replace(/^PMID:?\s*/i, "").trim();
            if (numericId) {
                retrievedPubMedPmids.add(numericId);
            }
        }
    }

    const retrievedClinicalTrialNctIds = new Set<string>();
    for (const t of trials) {
        const rawId = String(t.trialId || t.nctId || "").trim().toUpperCase();
        if (rawId && rawId !== "N/A") {
            retrievedClinicalTrialNctIds.add(rawId);
            if (!rawId.startsWith("NCT")) {
                retrievedClinicalTrialNctIds.add(`NCT${rawId}`);
            }
        }
    }

    // 2. Aggregate all 12 narrative fields
    const narrativeText = Object.values(report).join("\n");

    // 3. Extract and validate PMID identifiers
    // Matches patterns like [PMID: 38762798], PMID: 38762798, PMID 38762798, PMID38762798
    // Requires the literal 'PMID' keyword followed by digits (avoids sample sizes, years, percentages)
    const pmidRegex = /\bPMID\s*:?\s*(\d+)\b/gi;
    let pmidMatch: RegExpExecArray | null;
    let pmidCount = 0;

    while ((pmidMatch = pmidRegex.exec(narrativeText)) !== null) {
        const pmid = pmidMatch[1];
        pmidCount++;
        if (!retrievedPubMedPmids.has(pmid)) {
            console.error(`${logScope} Citation validation failed: Unsupported PMID '${pmid}' found in narrative.`);
            throw new Error(`Gemini generated an unsupported evidence identifier: PMID ${pmid}`);
        }
    }

    // 4. Extract and validate NCT identifiers
    // Matches patterns like [NCT: 04291508], NCT04291508, NCT 04291508, [NCT: NCT04291508], or hallucinated NCT038762798
    // Requires the literal 'NCT' keyword followed by digits
    const nctRegex = /\bNCT\s*:?\s*(?:NCT)?\s*(\d+)\b/gi;
    let nctMatch: RegExpExecArray | null;
    let nctCount = 0;

    while ((nctMatch = nctRegex.exec(narrativeText)) !== null) {
        const rawDigits = nctMatch[1];
        const nctId = `NCT${rawDigits}`.toUpperCase();
        nctCount++;
        if (!retrievedClinicalTrialNctIds.has(nctId)) {
            console.error(`${logScope} Citation validation failed: Unsupported NCT ID '${nctId}' found in narrative.`);
            throw new Error(`Gemini generated an unsupported evidence identifier: ${nctId}`);
        }
    }

    console.log(`[Telemetry] Citation validation passed: ${pmidCount} PMID references, ${nctCount} NCT references verified against retrieved evidence.`);
};