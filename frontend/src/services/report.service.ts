import { api } from "@/lib/api";

export const fetchSingleReport =
    async (
        id: string,
        token: string
    ) => {
        const response = await api.get(
            `/research/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    };