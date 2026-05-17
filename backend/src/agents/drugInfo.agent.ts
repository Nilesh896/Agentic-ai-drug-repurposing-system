import { searchDrugInformation } from "../services/openfda.service";

export const drugInfoAgent = async (
    query: string
) => {
    const drugData =
        await searchDrugInformation(query);

    return {
        source: "OpenFDA",

        message: drugData
            ? "Drug information fetched successfully"
            : "No drug information found",

        drugData,
    };
};