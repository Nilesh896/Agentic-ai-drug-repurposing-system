export interface ParsedQuery {
    originalQuery: string;
    drugName: string;
    diseaseName: string;
    drugSynonyms: string[];
    diseaseSynonyms: string[];
}

const DRUG_DICTIONARY: { [key: string]: string[] } = {
    paracetamol: ["paracetamol", "acetaminophen"],
    acetaminophen: ["paracetamol", "acetaminophen"],
    metformin: ["metformin", "glucophage"],
    glucophage: ["metformin", "glucophage"],
    aspirin: ["aspirin", "acetylsalicylic acid", "asa"],
    "acetylsalicylic acid": ["aspirin", "acetylsalicylic acid", "asa"],
    ibuprofen: ["ibuprofen", "advil", "motrin"],
    advil: ["ibuprofen", "advil", "motrin"],
    motrin: ["ibuprofen", "advil", "motrin"],
};

const DISEASE_DICTIONARY: { [key: string]: string[] } = {
    sepsis: ["sepsis", "septic", "septicemia", "septic shock"],
    septic: ["sepsis", "septic", "septicemia", "septic shock"],
    septicemia: ["sepsis", "septic", "septicemia", "septic shock"],
    cancer: ["cancer", "tumor", "oncology", "malignancy", "carcinoma", "neoplasm", "neoplasms"],
    tumor: ["cancer", "tumor", "oncology", "malignancy", "carcinoma", "neoplasm", "neoplasms"],
    oncology: ["cancer", "tumor", "oncology", "malignancy", "carcinoma", "neoplasm", "neoplasms"],
    neoplasm: ["cancer", "tumor", "oncology", "malignancy", "carcinoma", "neoplasm", "neoplasms"],
    neoplasms: ["cancer", "tumor", "oncology", "malignancy", "carcinoma", "neoplasm", "neoplasms"],
    cardiovascular: ["cardiovascular disease", "heart disease", "cardiovascular", "myocardial infarction"],
    "cardiovascular disease": ["cardiovascular disease", "heart disease", "cardiovascular", "myocardial infarction"],
    "heart disease": ["cardiovascular disease", "heart disease", "cardiovascular", "myocardial infarction"],
};

export const parseQuery = (query: string): ParsedQuery => {
    const cleanQuery = query.toLowerCase().replace(/[^a-z0-9\s-]/g, " ");

    let drugName = "";
    let drugSynonyms: string[] = [];
    let diseaseName = "";
    let diseaseSynonyms: string[] = [];

    // Find drug match
    for (const [key, synonyms] of Object.entries(DRUG_DICTIONARY)) {
        if (cleanQuery.includes(key)) {
            drugName = key;
            drugSynonyms = synonyms;
            break;
        }
    }

    // Find disease match
    for (const [key, synonyms] of Object.entries(DISEASE_DICTIONARY)) {
        if (cleanQuery.includes(key)) {
            diseaseName = key;
            diseaseSynonyms = synonyms;
            break;
        }
    }

    // Fallback if not found: use original query words
    if (!drugName && !diseaseName) {
        const words = cleanQuery.split(/\s+/).filter((w) => w.length > 2);
        drugName = words[0] || query;
        drugSynonyms = [drugName];
        diseaseName = words.slice(1).join(" ") || query;
        diseaseSynonyms = [diseaseName];
    } else if (!drugName) {
        // Only disease found
        const remaining = cleanQuery.replace(diseaseName, "").replace(/\b(use|in|for|treated|with)\b/g, "").trim();
        const words = remaining.split(/\s+/).filter((w) => w.length > 2);
        drugName = words[0] || "unknown-drug";
        drugSynonyms = [drugName];
    } else if (!diseaseName) {
        // Only drug found
        const remaining = cleanQuery.replace(drugName, "").replace(/\b(use|in|for|treated|with)\b/g, "").trim();
        diseaseName = remaining || "unknown-disease";
        diseaseSynonyms = [diseaseName];
    }

    return {
        originalQuery: query,
        drugName,
        diseaseName,
        drugSynonyms,
        diseaseSynonyms,
    };
};
