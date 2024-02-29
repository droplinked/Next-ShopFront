import { useContext, useEffect, useState } from "react";
import ExploreContext from "../context";
import { get_products_service } from "@/lib/apis/products/service";
import InfiniteScroll from "react-infinite-scroll-component";
import { IPaginationProducts, initialPaginationProducts } from "./interface";
import ExploreEachItem from "./each/explore-each-item";
import { L_Products } from "@/components/loading/landing";
import { AppTypography } from "@/components/shared";

const ExploreProducts = () => {
    const { states: { search } } = useContext(ExploreContext);
    const [pagination, setPagination] = useState<IPaginationProducts>(initialPaginationProducts);
    const _get = (page: number) => new Promise<any>(async (resolve, reject) => await get_products_service({ page, filter: search, limit: 8 }).then(({ data, ...pagination }) => resolve(setPagination((prev: any) => { return { ...prev, loading: false, ...pagination, data: data ? [...prev.data, ...data.filter((el: any) => !prev.data.map((product: any) => product._id).includes(el._id))] : [] }}))).catch((error) => reject(error)));
    useEffect(() => { setPagination(initialPaginationProducts); _get(1);}, [search]);

    return !pagination.loading ? (
        pagination.totalDocuments > 0 ? (
            <InfiniteScroll dataLength={pagination.totalDocuments} next={() => !pagination?.loading && pagination.nextPage && _get(pagination.nextPage)} hasMore={pagination.hasNextPage} loader={<L_Products m={true}/>}>
                <div className="grid grid-cols-4 gap-6">{pagination.data.map(({ _id, title, media, skuIDs}) => (<ExploreEachItem key={_id} label={title} media={media} skuIDs={skuIDs} id={_id}/>))}</div>
            </InfiniteScroll>
        ) : (<AppTypography>Oops, looks like the product doesn&apos;t exist.</AppTypography>)
    ) : (<L_Products/>);
};

export default ExploreProducts;
