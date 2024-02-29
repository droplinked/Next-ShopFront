import { AppCollapse } from "@/components/shared";

const ProductDescription = ({ description }: { description: string }) => {
    return (
        <AppCollapse>
            <div className="text-foreground testy" dangerouslySetInnerHTML={{ __html: description.replace("rgb(255, 255, 255)", "").concat(description).replace("rgb(255, 255, 255)", "") }}></div>
        </AppCollapse>
    );
};

export default ProductDescription;
