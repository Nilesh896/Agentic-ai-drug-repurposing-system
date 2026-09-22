import { searchPubMedArticles } from "./src/services/pubmed.service";
import { searchClinicalTrials } from "./src/services/clinicalTrial.service";
import { searchDrugInformation } from "./src/services/openfda.service";

async function main() {
    const query = "Ibuprofen";
    console.log(`--- Testing PubMed Service with query: "${query}" ---`);
    try {
        const articles = await searchPubMedArticles(query);
        console.log(`PubMed returned ${articles.length} articles.`);
        if (articles.length > 0) {
            console.log("First article:", JSON.stringify(articles[0], null, 2));
        }
    } catch (e) {
        console.error("PubMed service error:", e);
    }

    console.log(`\n--- Testing ClinicalTrials Service with query: "${query}" ---`);
    try {
        const trials = await searchClinicalTrials(query);
        console.log(`ClinicalTrials returned ${trials.length} trials.`);
        if (trials.length > 0) {
            console.log("First trial:", JSON.stringify(trials[0], null, 2));
        }
    } catch (e) {
        console.error("ClinicalTrials service error:", e);
    }

    console.log(`\n--- Testing OpenFDA Service with query: "${query}" ---`);
    try {
        const drugData = await searchDrugInformation(query);
        console.log(`OpenFDA returned drug data:`, drugData ? "Yes" : "No");
        if (drugData) {
            console.log("Drug Data details:", JSON.stringify(drugData, null, 2));
        }
    } catch (e) {
        console.error("OpenFDA service error:", e);
    }
}

main();
