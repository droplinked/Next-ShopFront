"use client";
import { useState } from "react";
import ExploreContext, { IExploreState, initialExploreState } from "./context";
import ExploreSidebar from "./sidebar/explore-sidebar";
import { cn } from "@/lib/utils/cn/cn";
import { app_vertical } from "@/lib/variables/variables";
import ExploreTools from "./tools/explore-tools";
import ExploreProducts from "./products/explore-products";

const Explore = () => {
    const [States, setStates] = useState<IExploreState>(initialExploreState);
    const updateStates = (key: string, value: any) => setStates((prev) => ({ ...prev, [key]: value }));

    return (
        <ExploreContext.Provider value={{ states: States, methods: { updateStates } }}>
            <div className="flex items-start justify-between md:flex-row w-full gap-6">
                <div className="w-[20%] sticky top-24">
                    <ExploreSidebar />
                </div>
                <div className={cn(app_vertical, "gap-9 w-full min-w-[80%]")}>
                    <ExploreTools />
                    <ExploreProducts />
                </div>
            </div>
        </ExploreContext.Provider>
    );
};

export default Explore;
