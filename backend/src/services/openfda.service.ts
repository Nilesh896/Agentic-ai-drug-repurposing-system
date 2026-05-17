import axios from "axios";

import { API_CONFIG } from "../config/api.config";

export const searchDrugInformation = async (
    query: string
) => {
    try {
        // Extract only drug name safely
        const drugName = query
            .replace(/["']/g, "")
            .trim()
            .split(" ")[0];

        const response = await axios.get(
            API_CONFIG.OPEN_FDA.DRUG_LABEL_URL,
            {
                params: {
                    search: `openfda.generic_name:${drugName}`,
                    limit: 1,
                },

                // Prevent API hanging
                timeout: 10000,
            }
        );

        const result =
            response.data.results?.[0];

        if (!result) {
            return null;
        }

        return {
            brandName:
                result.openfda
                    ?.brand_name?.[0] ||
                "Unknown",

            genericName:
                result.openfda
                    ?.generic_name?.[0] ||
                "Unknown",

            manufacturer:
                result.openfda
                    ?.manufacturer_name?.[0] ||
                "Unknown",

            purpose:
                result.purpose?.[0] ||
                "No purpose available",

            indicationsAndUsage:
                result.indications_and_usage?.[0]?.slice(
                    0,
                    1000
                ) ||
                "No indications available",

            adverseReactions:
                result.adverse_reactions?.[0]?.slice(
                    0,
                    1500
                ) ||
                "No adverse reactions available",
        };
    } catch (error) {
        console.error(
            "OpenFDA API Error:",
            error
        );

        return null;
    }
};