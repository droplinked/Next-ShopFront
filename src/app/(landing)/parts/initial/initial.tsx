"use client";
import useAppStore from "@/lib/stores/app/appStore";
import React, { useCallback, useEffect } from "react";

const Initial = ({ data }: { data: any }) => {
    const { methods: { updateState }} = useAppStore();
    const upd = useCallback(() => { updateState({ state: "shop", value: data }); console.log("updated") },[data]);
    useEffect(() => { upd() }, [data])
    return <></>;
};

export default Initial;
