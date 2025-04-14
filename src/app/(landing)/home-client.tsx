"use client";

import { cn } from "@/lib/utils/cn/cn";
import useAppShop from "@/functions/hooks/shop/useAppShop";
import { app_vertical } from "@/lib/variables/variables";
import { Banner, Explore, Initial } from "./parts";
import { useEffect, useState } from "react";

// Define interface based on the actual shop data structure
interface ShopData {
    name?: string;
    backgroundImage?: string;
    logo?: string;
    description?: string;
    backgroundColor?: string;
    _id?: string;
    [key: string]: any;
}

export default function HomeClient() {
    const { fetchShopData } = useAppShop();
    const [data, setData] = useState<ShopData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getShopData = async () => {
            try {
                const shopData = await fetchShopData();
                setData(shopData);
            } catch (error) {
                console.error("Error fetching shop data:", error);
            } finally {
                setLoading(false);
            }
        };

        getShopData();
    }, []);

    if (loading) {
        return <div className="container flex justify-center items-center mt-20 min-h-[50vh]">Loading...</div>;
    }
    
    return (
        <main className={cn("container flex gap-8 mt-20", app_vertical)}>
            <Initial data={data} />
            {data?.backgroundImage && data?.name && <Banner src={data?.backgroundImage} alt={data?.name} />}
            <Explore />
        </main>
    );
}