import Image from "next/image";

const EachItemCover = ({ alt, src }: { alt: string; src: string }) => {
    return (
        <div>
            <Image src={src} alt={`${alt} product's sku image`} width={288} height={288} />
        </div>
    );
};

export default EachItemCover;
