import { fetchInstance } from "../fetch-config";
import { ILoginService } from "./interface";
export const login_service = ({ ...props }: ILoginService) => fetchInstance("auth/wallet", { method: "POST", body: JSON.stringify(props) });
