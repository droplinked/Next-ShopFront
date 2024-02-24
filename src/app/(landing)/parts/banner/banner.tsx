import Image from "next/image";
import React from "react";

const Banner = ({ src, alt }: { src: string; alt: string }) =>  <Image className="rounded-sm" src={src} alt={`${alt} shop banner`} width={1500} height={400} />

export default Banner;
