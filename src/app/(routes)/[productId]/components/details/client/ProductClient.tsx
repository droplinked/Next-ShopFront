'use client';
import { IProduct } from '@/types/interfaces/product/product';
import { useCallback, useEffect, useState } from 'react';
import ProductPrice from './components/ProductPrice';
import ProductCartActions from './components/ProductCartActions';
import ProductQuantity from './components/ProductQuantity';
import ProductColors from './components/ProductColorSelector';
import ProductSizes from './components/ProductSizeSelector';
import ProductContext, { initialProductClientState, IProductClientState } from './context/ProductContext';
import productClientModel from './context/ProductOptionsModel';

const ProductClient = ({ product }: { product: IProduct }) => {
  const [States, setStates] = useState<IProductClientState>(
    initialProductClientState
  );
  const { getFirstOption, findSkuAsOption } = productClientModel;
  const updateState = (key: string, value: any) =>
    setStates((prev: IProductClientState) => ({ ...prev, [key]: value }));
  const updateOption = (key: string, value: any) =>
    setStates((prev: IProductClientState) => ({
      ...prev,
      option: { ...prev.option, [key]: value },
    }));
  const initialOptions = useCallback(
    (data: IProduct) =>
      setStates((prev: IProductClientState) => ({
        ...prev,
        product: product,
        option: {
          quantity: prev.option.quantity,
          ...getFirstOption(data?.skuIDs[0]),
        },
      })),
    [product]
  );
  useEffect(
    () =>
      updateState(
        'sku',
        States?.product?.product_type === 'DIGITAL'
          ? States?.product?.skuIDs[0]
          : findSkuAsOption({
              color: States.option.color,
              size: States.option.size,
              skuIDs: States.product?.skuIDs,
            })
      ),
    [States.option, States.product]
  );
  useEffect(() => initialOptions(product), [product]);

  return (
    <ProductContext.Provider
      value={{ states: States, methods: { updateOption, updateState } }}
    >
      <div className="flex flex-col gap-9">
        <ProductPrice />
        <ProductColors />
        <ProductSizes />
        <ProductQuantity />
        <ProductCartActions />
      </div>
    </ProductContext.Provider>
  );
};

export default ProductClient;
