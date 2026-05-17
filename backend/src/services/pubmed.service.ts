import axios from "axios";

import { API_CONFIG } from "../config/api.config";

export const searchPubMedArticles = async (
    query: string
) => {
    try {
        const searchResponse = await axios.get(
            API_CONFIG.PUBMED.SEARCH_URL,
            {
                params: {
                    db: "pubmed",
                    term: query,
                    retmode: "json",
                    retmax: 5,
                },
            }
        );

        const ids =
            searchResponse.data.esearchresult.idlist;

        if (!ids.length) {
            return [];
        }

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

        const result = summaryResponse.data.result;

        const articles = ids.map((id: string) => ({
            id,
            title: result[id]?.title || "No title available",
            authors:
                result[id]?.authors?.map(
                    (author: { name: string }) => author.name
                ) || [],
            publishDate:
                result[id]?.pubdate || "Unknown",
            source:
                result[id]?.source || "Unknown",
        }));

        return articles;
    } catch (error) {
        console.error("PubMed API Error:", error);

        return [];
    }
};