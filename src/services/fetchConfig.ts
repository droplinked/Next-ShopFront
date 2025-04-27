import { API_KEY, BASE_API_URL } from "@/lib/variables/variables";


export async function fetchInstance(url: string, options?: RequestInit) {
    try {
        if (!API_KEY) throw new Error("Unauthorized!");
        return await fetch(`${BASE_API_URL}${url}`, {
            ...options,
            headers: { "Content-Type": "application/json", "x-shop-id": API_KEY },
        }).then(async (response) => {
            if (response?.status === 401) {
                if (typeof window !== 'undefined') {
                    localStorage.clear();
                }
                throw new Error("Unauthorized!");
            }
            if (!response.ok) {
                const message = await response.text();
                throw new Error(message || "Network Error!");
            }
            return response.json();
        });
    } catch (error) {
        throw error;
    }
}
