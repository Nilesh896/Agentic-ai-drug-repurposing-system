import { api } from "@/lib/api";

export const generateResearch =
    async (
        query: string,
        token: string
    ) => {
        const response = await api.post(
            "/research/generate",
            {
                query,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    };