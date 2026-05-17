export interface ResearchResponse {
    success: boolean;

    message: string;

    data: {
        aiReport: string;

        savedReport: {
            id: string;

            pdfUrl: string;
        };
    };
}