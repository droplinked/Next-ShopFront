import { useRouter } from "next/router";

const Products = () => {
    const router = useRouter();
    router.push(`/`);
    return <div>Products</div>;
};

export default Products;
