'use client';
import { cn } from '@/lib/utils/cn/cn';
import { app_vertical } from '@/lib/variables/variables';
import { useState } from 'react';
import ActionBar from './components/action-bar/ActionBar';
import FilterSidebar from './components/filter-sidebar/FilterSidebar';
import ProductList from './components/product-list/ProductList';
import ExploreContext, { IExploreState, initialExploreState } from './context';

const ProductBrowser = () => {
  const [States, setStates] = useState<IExploreState>(initialExploreState);
  const updateStates = (key: string, value: any) =>
    setStates((prev) => ({ ...prev, [key]: value }));

  return (
    <ExploreContext.Provider
      value={{ states: States, methods: { updateStates } }}
    >
      <div className="flex items-start justify-between md:flex-row w-full gap-6">
        <div className="w-[20%] sticky top-24">
          <FilterSidebar />
        </div>
        <div className={cn(app_vertical, 'gap-9 w-full min-w-[80%]')}>
          <ActionBar />
          <ProductList />
        </div>
      </div>
    </ExploreContext.Provider>
  );
};

export default ProductBrowser;
