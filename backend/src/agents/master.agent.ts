import { literatureAgent } from "./literature.agent";
import { clinicalTrialAgent } from "./clinicalTrial.agent";
import { drugInfoAgent } from "./drugInfo.agent";
import { marketAgent } from "./market.agent";

export const masterAgent = async (
    query: string
) => {
    const [
        literatureData,
        clinicalTrialData,
        drugInfoData,
        marketData,
    ] = await Promise.all([
        literatureAgent(query),
        clinicalTrialAgent(query),
        drugInfoAgent(query),
        marketAgent(query),
    ]);

    return {
        query,
        literatureData,
        clinicalTrialData,
        drugInfoData,
        marketData,
    };
};