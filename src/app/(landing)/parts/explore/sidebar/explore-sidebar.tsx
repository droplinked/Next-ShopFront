import { cn } from '@/lib/utils/cn/cn'
import { app_vertical } from '@/lib/variables/variables'
import React from 'react'
import PriceSlider from './slider/price-slider'

const ExploreSidebar = () => {
  return (
    <form className={cn('border rounded-sm p-6 gap-6 sticky left-0 top-20 w-full h-80', app_vertical)}>
      <PriceSlider/>
    </form>
  )
}

export default ExploreSidebar