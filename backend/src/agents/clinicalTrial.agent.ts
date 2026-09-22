import { searchClinicalTrials } from "../services/clinicalTrial.service";
import { ParsedQuery } from "../utils/queryParser";

export const clinicalTrialAgent = async (
    query: string | ParsedQuery
) => {
    const trials = await searchClinicalTrials(query);

    return {
        source: "ClinicalTrials.gov",
        totalTrials: trials.length,
        message:
            trials.length > 0
                ? "Clinical trials fetched successfully"
                : "No clinical trials found for this query",
        trials,
    };
};