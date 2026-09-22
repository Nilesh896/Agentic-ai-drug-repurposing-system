import { searchDrugInformation } from "../services/openfda.service";
import { ParsedQuery } from "../utils/queryParser";

export const drugInfoAgent = async (
    query: string | ParsedQuery
) => {
    const drugData = await searchDrugInformation(query);

    return {
        source: "OpenFDA",
        message: drugData
            ? "Drug information fetched successfully"
            : "No drug information found",
        drugData,
    };
};