import { cn } from '@/lib/utils/cn/cn';
import { app_vertical } from '@/lib/variables/variables';
import React from 'react';
import PriceSlider from './slider/price-slider';

const FilterSidebar = () => {
  return (
    <form className={cn('border rounded-sm p-6 gap-6', app_vertical)}>
      <PriceSlider />
    </form>
  );
};

export default FilterSidebar;
