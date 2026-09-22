import axios from "axios";
import { API_CONFIG } from "../config/api.config";
import { ParsedQuery, parseQuery } from "../utils/queryParser";

function extractTagContent(xml: string, tagName: string): string {
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : "";
}

function extractAllAbstractTexts(xml: string): string {
    const regex = /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/gi;
    let match;
    const texts: string[] = [];
    while ((match = regex.exec(xml)) !== null) {
        texts.push(match[1].trim());
    }
    if (texts.length > 0) {
        return texts.join("\n").replace(/<\/?[^>]+(>|$)/g, "");
    }
    const abstractContent = extractTagContent(xml, "Abstract");
    return abstractContent.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

export const searchPubMedArticles = async (
    queryInput: string | ParsedQuery
) => {
    try {
        const parsed = typeof queryInput === "string" ? parseQuery(queryInput) : queryInput;

        // Build target boolean intersection query: (drug OR syn1 OR syn2) AND (disease OR syn1 OR syn2)
        let term = "";
        if (parsed.drugSynonyms.length > 0 && parsed.diseaseSynonyms.length > 0) {
            const drugTerms = parsed.drugSynonyms.map((s) => `"${s}"`).join(" OR ");
            const diseaseTerms = parsed.diseaseSynonyms.map((s) => `"${s}"`).join(" OR ");
            term = `(${drugTerms}) AND (${diseaseTerms})`;
        } else {
            term = parsed.originalQuery;
        }

        console.log(`[PubMed Search] Formulated query term: ${term}`);

        const searchResponse = await axios.get(
            API_CONFIG.PUBMED.SEARCH_URL,
            {
                params: {
                    db: "pubmed",
                    term: term,
                    retmode: "json",
                    retmax: 15,
                    sort: "relevance", // Enable relevance sorting
                },
            }
        );

        const ids = searchResponse.data.esearchresult?.idlist || [];

        if (!ids.length) {
            return [];
        }

        // Fetch metadata via esummary (JSON)
        const summaryResponse = await axios.get(
            API_CONFIG.PUBMED.SUMMARY_URL,
            {
                params: {
                    db: "pubmed",
                    id: ids.join(","),
                    retmode: "json",
                },
            }
        );

        const result = summaryResponse.data.result || {};

        // Fetch abstracts via efetch (XML)
        const abstractMap: { [pmid: string]: string } = {};
        try {
            const fetchResponse = await axios.get(
                "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi",
                {
                    params: {
                        db: "pubmed",
                        id: ids.join(","),
                        retmode: "xml",
                    },
                }
            );

            const xmlData = fetchResponse.data || "";
            const articlesXml = xmlData.split(/<\/PubmedArticle>/);
            articlesXml.forEach((piece: string) => {
                const pmidMatch = piece.match(/<PMID[^>]*>(\d+)<\/PMID>/i);
                if (pmidMatch) {
                    const pmid = pmidMatch[1];
                    const abstractText = extractAllAbstractTexts(piece);
                    if (abstractText) {
                        abstractMap[pmid] = abstractText;
                    }
                }
            });
        } catch (fetchErr: any) {
            console.error("PubMed efetch Error:", fetchErr.message || fetchErr);
        }

        const articles = ids.map((id: string) => {
            const articleData = result[id] || {};
            const title = articleData.title || "No title available";
            const source = articleData.source || "Unknown";
            const authors = articleData.authors?.map((a: { name: string }) => a.name) || [];
            const publishDate = articleData.pubdate || "Unknown";
            const abstract = abstractMap[id] || null;

            // Classify relevance: DIRECT, RELATED, INDIRECT, IRRELEVANT
            const titleLower = title.toLowerCase();
            const abstractLower = abstract ? abstract.toLowerCase() : "";

            const hasDrugInTitle = parsed.drugSynonyms.some((syn) => titleLower.includes(syn.toLowerCase()));
            const hasDiseaseInTitle = parsed.diseaseSynonyms.some((syn) => titleLower.includes(syn.toLowerCase()));

            const hasDrugInAbstract = parsed.drugSynonyms.some((syn) => abstractLower.includes(syn.toLowerCase()));
            const hasDiseaseInAbstract = parsed.diseaseSynonyms.some((syn) => abstractLower.includes(syn.toLowerCase()));

            const isToxicityOrOverdose = /overdose|toxic|poison|hepatotoxic|liver.injury|hepatic.injury/i.test(titleLower + " " + abstractLower);
            const isReviewOrPediatricOrModel = /review|meta-analysis|systematic.review|pediatric|children|infant|fever|pyrexia|diagnostic|prediction.model|prognostic/i.test(titleLower + " " + abstractLower);

            let relevance: "DIRECT" | "RELATED" | "INDIRECT" | "IRRELEVANT" = "IRRELEVANT";

            if (isToxicityOrOverdose || isReviewOrPediatricOrModel) {
                // If it evaluates toxicity, pediatric fever, or is a generic review/model, it is NOT direct therapeutic repurposing
                if (hasDrugInTitle || hasDrugInAbstract) {
                    relevance = "RELATED";
                } else if (hasDiseaseInTitle || hasDiseaseInAbstract) {
                    relevance = "INDIRECT";
                }
            } else {
                if (hasDrugInTitle && hasDiseaseInTitle) {
                    relevance = "DIRECT";
                } else if ((hasDrugInTitle && hasDiseaseInAbstract) || (hasDiseaseInTitle && hasDrugInAbstract)) {
                    relevance = "DIRECT";
                } else if (hasDrugInTitle || hasDrugInAbstract) {
                    relevance = "RELATED";
                } else if (hasDiseaseInTitle || hasDiseaseInAbstract) {
                    relevance = "INDIRECT";
                }
            }

            return {
                id, // PMID
                title,
                authors,
                publishDate,
                source,
                abstract,
                relevance,
            };
        });

        // Filter out completely IRRELEVANT papers
        const filteredArticles = articles.filter((art: any) => art.relevance !== "IRRELEVANT");

        // Sort by order of relevance: DIRECT -> RELATED -> INDIRECT
        const relevanceWeight: { [key: string]: number } = { DIRECT: 3, RELATED: 2, INDIRECT: 1, IRRELEVANT: 0 };
        filteredArticles.sort((a: any, b: any) => relevanceWeight[b.relevance] - relevanceWeight[a.relevance]);

        console.log(`[PubMed Search] Candidates fetched: ${articles.length}, passed relevance filtering: ${filteredArticles.length}`);

        return filteredArticles;
    } catch (error) {
        console.error("PubMed API Error:", error);
        return [];
    }
};