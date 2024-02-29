import { ICartItem } from '@/types/interfaces/cart/cart'
import { cn } from '@/lib/utils/cn/cn'
import { app_center, app_vertical } from '@/lib/variables/variables'
import Image from 'next/image'
import React from 'react'
import CartItemQuantity from './quantity/cart_item_quantity'
import { AppDotLabel, AppTypography } from '@/components/shared'

const EachCartItem = ({item}: {item: ICartItem}) => {
    const {product: { image, title }, options, totals: { priceItem }, _id, skuID} = item
  return (
    <div className='flex gap-4 justify-start items-start'>
        <Image src={image} width={80} height={80} alt={`${title} cart item image`}/>
        <div className={cn(app_vertical, "justify-start gap-4 w-full")}>
            <AppTypography appClassName='text-left w-full'>{title}</AppTypography>
            <div className={cn(app_vertical,'justify-start w-full gap-2')}><AppDotLabel label={"Size"} content={options?.size?.caption} appClassNames={{container: "flex gap-4 w-full", title: "text-normal text-secondary-foreground", dot: "text-normal text-secondary-foreground", value: "text-normal"}}/><AppDotLabel label={"Size"} content={options?.color?.caption} appClassNames={{container: "flex gap-4 w-full", title: "text-normal text-secondary-foreground", dot: "text-normal text-secondary-foreground", value: "text-normal"}}/></div>
            <div className={cn(app_center,'justify-between w-full')}><CartItemQuantity options={options} skuID={skuID} _id={_id}/><AppTypography price appClassName='text-base'>{priceItem}</AppTypography></div>
        </div>
    </div>
  )
}

export default EachCartItem