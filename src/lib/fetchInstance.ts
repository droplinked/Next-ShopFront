import { API_KEY, BASE_API_URL } from "./variables/variables";


export async function fetchInstance(url: string, options?: RequestInit) {
  if (!API_KEY) throw new Error("Unauthorized!");

  const response = await fetch(`${BASE_API_URL}${url}`, {
    credentials: 'include',
    headers: { 
      "Content-Type": "application/json", 
      "x-shop-id": API_KEY,
      "Accept": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Network Error");
  }

  return response.json();
}
