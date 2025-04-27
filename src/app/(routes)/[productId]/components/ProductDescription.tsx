import { AppCollapse } from '@/components/ui';

const ProductDescription = ({ description }: { description: string }) => {
  return (
    <AppCollapse>
      <div
        className="text-foreground"
        dangerouslySetInnerHTML={{
          __html: description.replace('rgb(255, 255, 255)', ''),
        }}
      ></div>
    </AppCollapse>
  );
};

export default ProductDescription;
