import { searchPubMedArticles } from "../services/pubmed.service";

export const literatureAgent = async (
    query: string
) => {
    const articles =
        await searchPubMedArticles(query);

    return {
        source: "PubMed",
        totalArticles: articles.length,
        articles,
    };
};