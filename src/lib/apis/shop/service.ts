import { fetchInstance } from "../fetch-config"

export const get_shop_service = () => fetchInstance(`shop`, { cache: "no-cache" })
