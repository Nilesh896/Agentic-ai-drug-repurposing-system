export interface ResearchReport {
    id: string;

    title: string;

    summary: string;

    content?: string;
    
    aiInsights?: string;

    pdfUrl: string;

    createdAt: string;
}