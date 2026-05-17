import { api } from "@/lib/api";

export const fetchReports = async (
    token: string
) => {
    const response = await api.get(
        "/research/history",
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};

export const fetchReportById =
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