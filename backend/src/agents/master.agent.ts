import { literatureAgent } from "./literature.agent";
import { clinicalTrialAgent } from "./clinicalTrial.agent";
import { drugInfoAgent } from "./drugInfo.agent";
import { marketAgent } from "./market.agent";
import { ParsedQuery, parseQuery } from "../utils/queryParser";

export const masterAgent = async (
    queryInput: string | ParsedQuery
) => {
    const parsed = typeof queryInput === "string" ? parseQuery(queryInput) : queryInput;

    const t0Master = Date.now();
    const t0Pub = Date.now();
    const pubmedPromise = literatureAgent(parsed).then((res) => {
        console.log(`[Telemetry] PubMed fetch time: ${Date.now() - t0Pub}ms`);
        return res;
    });

    const t0Trials = Date.now();
    const trialPromise = clinicalTrialAgent(parsed).then((res) => {
        console.log(`[Telemetry] ClinicalTrials fetch time: ${Date.now() - t0Trials}ms`);
        return res;
    });

    const t0Fda = Date.now();
    const fdaPromise = drugInfoAgent(parsed).then((res) => {
        console.log(`[Telemetry] OpenFDA fetch time: ${Date.now() - t0Fda}ms`);
        return res;
    });

    const [
        literatureData,
        clinicalTrialData,
        drugInfoData,
        marketData,
    ] = await Promise.all([
        pubmedPromise,
        trialPromise,
        fdaPromise,
        marketAgent(parsed.originalQuery),
    ]);

    console.log(`[Telemetry] masterAgent total time: ${Date.now() - t0Master}ms`);

    return {
        query: parsed.originalQuery,
        literatureData,
        clinicalTrialData,
        drugInfoData,
        marketData,
    };
};