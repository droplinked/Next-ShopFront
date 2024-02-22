import AppCollapse from "@/components/shared/collapse/AppCollapse";

const ProductDescription = ({ description }: { description: string }) => {
    return (
        <AppCollapse label="Description">
            <div className="text-foreground" dangerouslySetInnerHTML={{ __html: description.replace("rgb(255, 255, 255)", "").concat(description).replace("rgb(255, 255, 255)", "") }}></div>
        </AppCollapse>
    );
};

export default ProductDescription;
