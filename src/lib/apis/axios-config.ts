import axios, { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { BASE_API_URL } from "../variables/variables";
// import store
const axiosInstance = axios.create({
    baseURL: BASE_API_URL,
});

axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig<any>) => {
        // const token = store.getState().jwt || "";
        if (!config?.headers?.authorization) config.headers.set({ ...config.headers, authorization: `Bearer ${"token" || ""}` }, true);
        return config;
    },
    (error: any) => Promise.reject(error)
);
axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async function (error: any) {
        const statusCode = error?.response?.status;
        if (statusCode === 401) localStorage.clear()
        return Promise.reject(error);
    }
);

export default axiosInstance;
