import axios from "axios";
import { API_CONFIG } from "../config/api.config";
import { ParsedQuery, parseQuery } from "../utils/queryParser";

export const searchClinicalTrials = async (
    queryInput: string | ParsedQuery
) => {
    try {
        const parsed = typeof queryInput === "string" ? parseQuery(queryInput) : queryInput;

        const params: any = {};
        if (parsed.drugSynonyms.length > 0 && parsed.diseaseSynonyms.length > 0) {
            params["query.cond"] = parsed.diseaseSynonyms.join(" OR ");
            params["query.term"] = parsed.drugSynonyms.join(" OR ");
        } else {
            params["query.term"] = parsed.originalQuery;
        }
        params.pageSize = 10;

        console.log(`[ClinicalTrials Search] Params:`, params);

        const response = await axios.get(
            API_CONFIG.CLINICAL_TRIALS.SEARCH_URL,
            {
                params,
            }
        );

        const studies = response.data.studies || [];

        const trials = studies.map((study: any) => {
            const protocol = study.protocolSection || {};
            const results = study.resultsSection || null;

            const trialId = protocol.identificationModule?.nctId || "N/A";
            const briefTitle = protocol.identificationModule?.briefTitle || "No title";
            const officialTitle = protocol.identificationModule?.officialTitle || null;

            const briefSummary = protocol.descriptionModule?.briefSummary || null;
            const detailedDescription = protocol.descriptionModule?.detailedDescription || null;

            const status = protocol.statusModule?.overallStatus || "Unknown";
            const phase = protocol.designModule?.phases || [];

            const enrollmentCount = protocol.designModule?.enrollmentInfo?.count ?? null;
            const enrollmentType = protocol.designModule?.enrollmentInfo?.type ?? null;

            const conditions = protocol.conditionsModule?.conditions || [];
            const condition = conditions[0] || parsed.diseaseName;

            const interventions = (protocol.armsInterventionsModule?.interventions || []).map((i: any) => ({
                type: i.type || "Unknown",
                name: i.name || "Unknown",
                description: i.description || null,
            }));

            const primaryOutcomes = (protocol.outcomesModule?.primaryOutcomes || []).map((o: any) => ({
                measure: o.measure || "",
                timeFrame: o.timeFrame || "",
                description: o.description || null,
            }));

            const secondaryOutcomes = (protocol.outcomesModule?.secondaryOutcomes || []).map((o: any) => ({
                measure: o.measure || "",
                timeFrame: o.timeFrame || "",
                description: o.description || null,
            }));

            const completionDate = protocol.statusModule?.completionDateStruct?.date || null;
            const completionDateType = protocol.statusModule?.completionDateStruct?.type || null;

            const outcomeResults = results ? {
                participantFlow: results.participantFlowModule || null,
                baselineCharacteristics: results.baselineCharacteristicsModule || null,
                outcomeMeasures: results.outcomeMeasuresModule || null,
                adverseEvents: results.adverseEventsModule || null,
            } : null;

            // Classify relevance: DIRECT, RELATED, INDIRECT, IRRELEVANT
            const titleLower = briefTitle.toLowerCase();
            const officialTitleLower = (officialTitle || "").toLowerCase();
            const summaryLower = (briefSummary || "").toLowerCase();
            const descriptionLower = (detailedDescription || "").toLowerCase();

            // Match disease
            const hasDiseaseInConditions = conditions.some((c: string) =>
                parsed.diseaseSynonyms.some((syn) => c.toLowerCase().includes(syn.toLowerCase()))
            );
            const hasDiseaseInTitle = parsed.diseaseSynonyms.some((syn) =>
                titleLower.includes(syn.toLowerCase()) || officialTitleLower.includes(syn.toLowerCase())
            );
            const matchesDisease = hasDiseaseInConditions || hasDiseaseInTitle;

            // Match drug as intervention
            const drugInterventions = interventions.filter((i: any) =>
                parsed.drugSynonyms.some((syn) => i.name.toLowerCase().includes(syn.toLowerCase()))
            );
            const hasDrugAsIntervention = drugInterventions.length > 0;

            // Match drug in description text or title
            const hasDrugInText = parsed.drugSynonyms.some((syn) =>
                titleLower.includes(syn.toLowerCase()) ||
                officialTitleLower.includes(syn.toLowerCase()) ||
                summaryLower.includes(syn.toLowerCase()) ||
                descriptionLower.includes(syn.toLowerCase())
            );

            let relevance: "DIRECT" | "RELATED" | "INDIRECT" | "IRRELEVANT" = "IRRELEVANT";

            const isToxicityOrOverdoseCt = /overdose|toxic|poison|hepatotoxic|liver.injury|hepatic.injury/i.test(titleLower + " " + summaryLower + " " + descriptionLower);
            const isPediatricFeverCt = /pediatric|children|infant|fever|pyrexia/i.test(titleLower + " " + summaryLower + " " + descriptionLower);

            const isDrugInterventionSupportive = drugInterventions.some((i: any) => {
                const desc = (i.description || "").toLowerCase();
                const name = i.name.toLowerCase();
                return /rescue|background|standard.of.care|allowed|supportive|prn|as.needed|pain.control|fever.control|pyrexia/i.test(desc) || 
                       /rescue|background|standard.of.care|allowed|supportive|prn|as.needed/i.test(name);
            });

            if (matchesDisease && hasDrugAsIntervention) {
                // Check if drug is used primarily as supportive/rescue/background treatment
                const supportiveKeywords = ["fever", "fever control", "antipyretic", "temperature", "analgesic", "pain", "comfort", "supportive", "standard care", "standard of care", "rescue", "allowed"];
                
                const isSupportive = supportiveKeywords.some(keyword => {
                    const inTitle = titleLower.includes(keyword) || officialTitleLower.includes(keyword);
                    const inInterventions = interventions.some((i: any) => 
                        i.name.toLowerCase().includes(keyword) || 
                        (i.description || "").toLowerCase().includes(keyword)
                    );
                    return inTitle || inInterventions;
                });

                if (isSupportive || isToxicityOrOverdoseCt || isPediatricFeverCt || isDrugInterventionSupportive) {
                    relevance = "RELATED"; // Supportive/rescue/background care is RELATED
                } else {
                    relevance = "DIRECT"; // Meaningful evaluation for repurposing
                }
            } else if (matchesDisease && hasDrugInText) {
                relevance = "RELATED"; // Disease matches, drug is mentioned in text but not evaluated as intervention
            } else if (matchesDisease) {
                relevance = "INDIRECT"; // Target disease matches, but drug is not studied/mentioned
            } else if (hasDrugAsIntervention || hasDrugInText) {
                relevance = "RELATED"; // Drug is studied, but disease does not match
            }

            return {
                trialId,
                briefTitle,
                officialTitle,
                briefSummary,
                detailedDescription,
                status,
                phase,
                enrollmentCount,
                enrollmentType,
                conditions,
                condition,
                interventions,
                primaryOutcomes,
                secondaryOutcomes,
                completionDate,
                completionDateType,
                outcomeResults,
                relevance,
            };
        });

        // Filter out completely IRRELEVANT records
        const filteredTrials = trials.filter((t: any) => t.relevance !== "IRRELEVANT");

        // Sort by order of relevance: DIRECT -> RELATED -> INDIRECT
        const relevanceWeight: { [key: string]: number } = { DIRECT: 3, RELATED: 2, INDIRECT: 1, IRRELEVANT: 0 };
        filteredTrials.sort((a: any, b: any) => relevanceWeight[b.relevance] - relevanceWeight[a.relevance]);

        console.log(`[ClinicalTrials Search] Candidates fetched: ${studies.length}, passed relevance filtering: ${filteredTrials.length}`);

        return filteredTrials;
    } catch (error) {
        console.error("ClinicalTrials API Error:", error);
        return [];
    }
};