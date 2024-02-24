export const initialProductProps: IProduct = {
    _id: "",
    ownerID: "",
    title: "",
    description: "",
    type: "",
    product_type: "",
    artwork: "",
    artwork_position: "",
    m2m_positions_options: [],
    m2m_positions: [],
    m2m_services: [],
    pod_blank_product_id: "",
    publish_status: "",
    productCollectionID: {
        _id: "",
        title: "",
        ownerID: "",
        nftImages: [],
        type: "",
        published: false,
        createdAt: "",
        updatedAt: "",
    },
    skuIDs: [],
    media: [],
    priceUnit: "",
    shippingType: "",
    shippingPrice: 0,
    thumb: "",
    purchaseAvailable: false,
    digitalDetail: {
        file_url: null,
        message: null,
    },
    positions: [],
    printful_template_id: 0,
    custome_external_id: "",
    tags: [],
    technique: "",
    isAddToCartDisabled: false,
    subCategories: [],
    vas: [],
    partialOwners: [],
    createdAt: "",
    updatedAt: "",
    ruleSet: null,
};

export const initialSkuProps: ISku = {
    _id: "",
    ownerID: "",
    recordData: null,
    price: 0,
    rawPrice: 0,
    quantity: 0,
    weight: 0,
    sold_units: 0,
    externalID: "",
    options: [],
    dimensions: null,
    vas: [],
    royalty: 0,
    partialOwners: [],
    createdAt: "",
    updatedAt: "",
    commission: 0,
};

export default initialProductProps;

export interface IProduct {
    _id: string;
    ownerID: string;
    title: string;
    description: string;
    type: string;
    product_type: string;
    artwork: string;
    artwork_position: string;
    m2m_positions_options: IM2MPositionOption[];
    m2m_positions: IM2MPosition[];
    m2m_services: IM2MService[];
    pod_blank_product_id: string;
    publish_status: string;
    productCollectionID: IProductCollection;
    skuIDs: ISku[];
    media: IProductMedia[];
    priceUnit: string;
    shippingType: string;
    shippingPrice: number;
    thumb: string;
    purchaseAvailable: boolean;
    digitalDetail: IDigitalDetail;
    positions: any[];
    printful_template_id: number;
    custome_external_id: string;
    tags: string[];
    technique: string;
    isAddToCartDisabled: boolean;
    subCategories: any[];
    vas: IValueAddedService[];
    partialOwners: string[];
    createdAt: string;
    updatedAt: string;
    ruleSet: any;
}

interface IM2MPositionOption {
    variant_ids: string[];
    placement: string;
    url: string;
    position: any;
    options: any[];
}

interface IM2MPosition {
    variant_ids: string[];
    placement: string;
    url: string;
    position: any;
    options: any[];
}

interface IM2MService {
    _id: string;
    name: string;
    chain?: string;
}

interface IProductCollection {
    _id: string;
    title: string;
    ownerID: string;
    nftImages: any[];
    type: string;
    published: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ISku {
    _id: string;
    ownerID: string;
    recordData: any;
    price: number;
    rawPrice: number;
    quantity: number;
    weight: number;
    sold_units: number;
    externalID: string;
    options: any[];
    dimensions: any;
    vas: any[];
    royalty: number;
    partialOwners: string[];
    createdAt: string;
    updatedAt: string;
    commission: number;
}

export interface IProductMedia {
    url: string;
    isMain: "true" | "false";
    thumbnail: string;
    _id: string;
}

interface IDigitalDetail {
    file_url: string | null;
    message: string | null;
}

interface IValueAddedService {
    name: string;
    costType: string;
    value: string;
    type: string;
    receiver: string;
}
