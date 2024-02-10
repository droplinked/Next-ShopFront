import { useRouter } from "next/router";
import React from "react";

const Products = () => {
    const router = useRouter();
    router.push(`/`);
    return <div>Products</div>;
};

export default Products;
