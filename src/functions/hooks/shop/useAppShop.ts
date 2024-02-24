import { get_shop_service } from "@/lib/apis/shop/service";

function useAppShop() {
    const get = async () => await new Promise<any>(async (resolve, reject) => await get_shop_service().then((res) => resolve(res)).catch((error) => reject(error)));

    return { get }
}

export default useAppShop;
