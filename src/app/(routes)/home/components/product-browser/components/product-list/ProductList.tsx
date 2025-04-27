import { useCallback, useContext, useEffect, useState } from 'react';
import ExploreContext from '../../context';
import InfiniteScroll from 'react-infinite-scroll-component';
import { IPaginationProducts, initialPaginationProducts } from './interface';
import ProductCard from '../product-card/ProductCard';
import { AppTypography } from '@/components/ui';
import { get_products_service } from '@/services/products/service';
import { LoadingProductList } from './LoadingProductList';

const ProductList = () => {
  const { states: { search },} = useContext(ExploreContext);
  const [pagination, setPagination] = useState<IPaginationProducts>( initialPaginationProducts);

  const _get = useCallback(
    (page: number) =>
      new Promise<any>(async (resolve, reject) => {
        try {
          const response = await get_products_service({
            page,
            filter: search,
            limit: 20,
          });
          const { data, ...paginationInfo } = response;

          setPagination((prev: IPaginationProducts) => {
            return {
              ...prev,
              loading: false,
              ...paginationInfo,
              data: data
                ? [
                    ...prev.data,
                    ...data.filter(
                      (el: any) =>
                        !prev.data
                          .map((product: any) => product._id)
                          .includes(el._id)
                    ),
                  ]
                : [],
            };
          });
          resolve(response);
        } catch (error) {
          console.error('Failed to fetch products:', error);
          setPagination((prev) => ({ ...prev, loading: false }));
          reject(error);
        }
      }),
    [search]
  );

  useEffect(() => {
    setPagination(initialPaginationProducts);
    _get(1);
  }, [_get]);

  return !pagination.loading ? (
    pagination.totalDocuments > 0 ? (
      <InfiniteScroll
        dataLength={pagination.totalDocuments}
        next={() =>
          !pagination?.loading &&
          pagination.nextPage &&
          _get(pagination.nextPage)
        }
        hasMore={pagination.hasNextPage}
        loader={<LoadingProductList m={true} />}
      >
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pagination.data.map(({ _id, title, media, skuIDs }) => (
            <ProductCard
              key={_id}
              label={title}
              media={media}
              skuIDs={skuIDs}
              id={_id}
            />
          ))}
        </div>
      </InfiniteScroll>
    ) : (
      <AppTypography>
        Oops, looks like the product doesn&apos;t exist.
      </AppTypography>
    )
  ) : (
    <LoadingProductList />
  );
};

export default ProductList;
