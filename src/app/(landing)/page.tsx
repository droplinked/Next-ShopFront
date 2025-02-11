import { cn } from "@/lib/utils/cn/cn";
import useAppShop from "@/functions/hooks/shop/useAppShop";
import { app_vertical } from "@/lib/variables/variables";
import { Banner, Explore, Initial } from "./parts";
import useAppStore from "@/lib/stores/app/appStore";

export default async function Home() {
    const { fetchShopData  } = useAppShop();
    const data = await fetchShopData();
    
    return (
        <main className={cn("container flex gap-8 mt-20", app_vertical)}>
            <Initial data={data} />
            {data?.backgroundImage && data?.name && <Banner src={data?.backgroundImage} alt={data?.name} />}
            <Explore/>
        </main>
    );
}
