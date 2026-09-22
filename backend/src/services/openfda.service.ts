import axios from "axios";
import { API_CONFIG } from "../config/api.config";
import { ParsedQuery, parseQuery } from "../utils/queryParser";

export const searchDrugInformation = async (
    queryInput: string | ParsedQuery
) => {
    let drugName = "";
    try {
        const parsed = typeof queryInput === "string" ? parseQuery(queryInput) : queryInput;

        // Use the parsed drugName, falling back safely to the first word if empty
        drugName = parsed.drugName
            ? parsed.drugName.trim().toLowerCase()
            : parsed.originalQuery.replace(/["']/g, "").trim().split(" ")[0].toLowerCase();

        // Translate paracetamol to US generic acetaminophen name
        if (drugName === "paracetamol") {
            drugName = "acetaminophen";
        }

        console.log(`[OpenFDA Search] Generic name term: ${drugName}`);

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

        const result = response.data.results?.[0];

        if (!result) {
            console.log(`[OpenFDA Search] No drug information found for generic name: ${drugName}`);
            return null;
        }

        return {
            brandName:
                result.openfda?.brand_name?.[0] || "Not available in retrieved FDA data",

            genericName:
                result.openfda?.generic_name?.[0] || "Not available in retrieved FDA data",

            manufacturer:
                result.openfda?.manufacturer_name?.[0] || "Not available in retrieved FDA data",

            purpose:
                result.purpose?.[0] || "Not available in retrieved FDA data",

            indicationsAndUsage:
                result.indications_and_usage?.[0]?.slice(0, 1000) ||
                "Not available in retrieved FDA data",

            adverseReactions:
                result.adverse_reactions?.[0]?.slice(0, 1500) ||
                "Not available in retrieved FDA data",
        };
    } catch (error: any) {
        if (error.response?.status === 404) {
            console.log(`[OpenFDA Search] Drug generic name not found (404) for name: ${drugName}`);
        } else {
            console.error("OpenFDA API Error:", error.message || error);
        }
        return null;
    }
};