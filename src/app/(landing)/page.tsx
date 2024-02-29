import { cn } from "@/lib/utils/cn/cn";
import useAppShop from "@/functions/hooks/shop/useAppShop";
import { app_vertical } from "@/lib/variables/variables";
import { Banner, Explore, Initial } from "./parts";
import { AppButton } from "@/components/shared";
import L_Product from "@/components/loading/product";

export default async function Home() {
    const { get } = useAppShop();
    const data = await get();
    return (
        <main className={cn("container flex gap-8 mt-20", app_vertical)}>
            <Initial data={data} />
            {data?.backgroundImage && data?.name && <Banner src={data?.backgroundImage} alt={data?.name} />}
            <AppButton>Button</AppButton>
            <L_Product/>
            <AppButton appVariant="outlined">Button</AppButton>
            <Explore/>
        </main>
    );
}
