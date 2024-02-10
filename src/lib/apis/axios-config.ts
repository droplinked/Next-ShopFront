import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { BASE_API_URL } from "../utils/app/variable";
import AppStorage from "../utils/app/sessions";
import useAppStore from "../stores/app/appStore";

const axiosInstance = axios.create({
    baseURL: BASE_API_URL,
});

axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig<any>) => {
        const appStore = useAppStore.getState().access_token || "";
        if (!config?.headers?.authorization) config.headers.set({ ...config.headers, authorization: `Bearer ${appStore || ""}` }, true);
        return config;
    },
    (error: any) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async function (error: any) {
        // const config = error.config as AxiosRequestConfig;
        const statusCode = error?.response?.status;
        if (
            statusCode === 401
            // && !config._retry
        ) {
            // config._retry = true;
            // if (!refreshPromise) refreshPromise = refreshAccessToken().finally(clearPromise);
            // const token = await refreshPromise;
            // config.headers!.authorization = `Bearer ${token}`;
            // return axiosInstance(config);
            AppStorage.clearStorage();
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;

// const setToken = async (access_token: string, refresh_token: string): Promise<void> => {
//     useAppStore.setState((prev: any) => ({ ...prev, ...{ access_token, refresh_token } }));
// };

// let refreshPromise: Promise<string> | null = null;
// const clearPromise = () => {
//     refreshPromise = null;
// };

// Function to refresh the access token
// const refreshAccessToken = async (): Promise<string> => {
//     try {
//         const { refresh_token } = useAppStore.getState();
//         const response = await axios.post<{ data: { access_token: string; refresh_token: string } }>(
//             `${BASE_API_URL}/auth/refresh-token`,
//             {},
//             {
//                 headers: { Authorization: `Bearer ${refresh_token}` },
//             }
//         );
//         const data = response?.data?.data;
//         if (data) {
//             await setToken(data.access_token, data.refresh_token);
//             return data.access_token;
//         } else {
//             throw new Error("Failed to refresh access token");
//         }
//     } catch (error) {
//         AppStorage.clearStorage();
//         window.location.replace(window.location.origin);
//         throw error;
//     }
// };
