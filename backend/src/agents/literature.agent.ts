import { searchPubMedArticles } from "../services/pubmed.service";
import { ParsedQuery } from "../utils/queryParser";

export const literatureAgent = async (
    query: string | ParsedQuery
) => {
    const articles = await searchPubMedArticles(query);

    return {
        source: "PubMed",
        totalArticles: articles.length,
        articles,
    };
};