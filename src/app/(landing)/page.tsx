import { cn } from "@/lib/utils/cn/cn";
import Banner from "./parts/banner/banner";
import Explore from "./parts/explore/explore";
import Initial from "./parts/initial/initial";
import useAppShop from "@/functions/hooks/shop/useAppShop";
import { app_vertical } from "@/lib/variables/variables";

export default async function Home() {
    const { get } = useAppShop();
    const data = await get();
    return (
        <main className={cn("container flex gap-8 mt-20", app_vertical)}>
            <Initial data={data} />
            {data?.backgroundImage && data?.name && <Banner src={data?.backgroundImage} alt={data?.name} />}
            <Explore/>
        </main>
    );
}
