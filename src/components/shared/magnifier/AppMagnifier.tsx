"use client";
import React, { useCallback, useEffect, useState } from "react";
import NextImage from "next/image";
import { IAppMagnifier } from "./interface";

function AppMagnifier({ src, alt, magnifierRadius, zoom = 2, ...props }: IAppMagnifier) {
    const [magnifierState, setMagnifierState] = useState({
        top: -80,
        left: -80,
        offsetX: 0,
        offsetY: 0,
        width: 0,
        height: 0,
    });
    useEffect(() => {
        const img = new Image();
        img.src = src;
    }, [src]);

    const [isVisible, setIsVisible] = useState(false);

    const mouseover = useCallback(
        (e: any) => {
            setIsVisible(true);
            const smallImage = e.currentTarget;
            const x = e.nativeEvent.offsetX;
            const y = e.nativeEvent.offsetY;
            const magnifierBackgroundSize = { width: smallImage.width * zoom, height: smallImage.height * zoom };

            setMagnifierState({
                top: y - magnifierRadius - 100,
                left: x - magnifierRadius - 100,
                offsetX: (x / smallImage.width) * magnifierBackgroundSize.width - magnifierRadius,
                offsetY: (y / smallImage.height) * magnifierBackgroundSize.height - magnifierRadius,
                width: magnifierBackgroundSize.width,
                height: magnifierBackgroundSize.height,
            });
        },
        [magnifierRadius, zoom]
    );

    return (
        <div className="relative flex overflow-hidden justify-center items-center">
            <NextImage width={600} height={600} src={src} onMouseMove={mouseover} onMouseLeave={() => setIsVisible(false)} onClick={() => setIsVisible(false)} alt={alt} {...props} />
            <div
                className={`absolute border-4 border-gray-300 rounded-lg bg-white z-10 block transition-opacity ${isVisible ? "opacity-100" : "opacity-0"}`}
                style={{
                    boxShadow: "0 5px 10px -2px rgba(0, 0, 0, 0.3)",
                    pointerEvents: "none",
                    width: 8 * magnifierRadius,
                    height: 8 * magnifierRadius,
                    top: magnifierState.top + "px",
                    left: magnifierState.left + "px",
                    backgroundRepeat: "no-repeat",
                    backgroundColor: "#FFF",
                    backgroundImage: `url("${src}")`,
                    backgroundPositionX: -1 * magnifierState.offsetX + "px",
                    backgroundPositionY: -1 * magnifierState.offsetY + "px",
                    backgroundSize: `${magnifierState.width}px ${magnifierState.width}px`,
                }}
            />
        </div>
    );
}

export default AppMagnifier;
