import axios from "axios";

import { API_CONFIG } from "../config/api.config";

export const searchClinicalTrials = async (
    query: string
) => {
    try {
        const response = await axios.get(
            API_CONFIG.CLINICAL_TRIALS.SEARCH_URL,
            {
                params: {
                    "query.term": query,
                    pageSize: 5,
                },
            }
        );

        const studies =
            response.data.studies || [];

        return studies.map((study: any) => ({
            trialId: study.protocolSection?.identificationModule?.nctId || "N/A",

            title:
                study.protocolSection?.identificationModule?.briefTitle ||
                "No title",

            status:
                study.protocolSection?.statusModule?.overallStatus ||
                "Unknown",

            phase:
                study.protocolSection?.designModule?.phases?.[0] ||
                "Not specified",

            condition:
                study.protocolSection?.conditionsModule?.conditions?.[0] || query,
        }));
    } catch (error) {
        console.error(
            "ClinicalTrials API Error:",
            error
        );

        return [];
    }
};