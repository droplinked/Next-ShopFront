import Image from 'next/image';

const ProductImage = ({ alt, src }: { alt: string; src: string }) => {
  return (
    <Image
      src={src}
      className="h-full object-contain"
      alt={`${alt} product's sku image`}
      width={288}
      height={288}
    />
  );
};

export default ProductImage;
