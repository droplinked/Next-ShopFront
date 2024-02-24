"use client";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import AppMagnifier from "@/components/shared/magnifier/AppMagnifier";
import AppTypography from "@/components/shared/typography/AppTypography";
import { bindTrigger, usePopupState } from "material-ui-popup-state/hooks";
import Image from "next/image";
import { useMediaQuery } from "@mui/material";
import { ms } from "@/lib/utils/ms/ms";
import { IProductMedia } from "@/types/interfaces/product/product";
function ProductSlider({ media }: { media: IProductMedia[] }) {
    const [ImageSlider, setImageSlider] = useState(null);
    const popupState = usePopupState({ variant: "dialog", popupId: "demoMenu" });
    return (
        <section className="flex flex-col justify-center items-center gap-5">
            <AppMagnifier alt={"product image"} src={ImageSlider || ms(media)} magnifierRadius={50} zoom={2} />
            <div className="grid grid-cols-4 gap-5 md:gap-0 lg:gap-5">
                {media && media?.length
                    ? media?.slice(0, 4).map((el: any, key: number) => (
                          <div key={key} className="rounded-sm relative" onClick={() => setImageSlider(el.url)}>
                              {[media?.length - 1, 4 - 1]?.includes(key) && (
                                  <div {...bindTrigger(popupState)} className="rounded-sm flex absolute top-0 bottom-0 left-0 right-0 items-center cursor-pointer justify-center text-center z-10 bg-[rgba(0,0,0,.6)]" >
                                      <AppTypography appClassName="text-white text-xs">See More</AppTypography>
                                  </div>
                              )}
                              <Image className="cursor-pointer object-cover" alt="product image" src={el.url} width={132} height={132} />
                          </div>
                      ))
                    : null}
            </div>
            <Lightbox
                plugins={[Thumbnails]}
                thumbnails={{ position: "bottom", border: 0, imageFit: "contain", gap: 0 }}
                open={popupState.isOpen}
                close={popupState.close}
                slides={media && media?.length ? media?.map((el: any) => ({ src: el.url })) : []}
            />
        </section>
    );
}

export default ProductSlider;
