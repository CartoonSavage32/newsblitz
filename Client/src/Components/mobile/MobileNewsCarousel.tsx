import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import type { NewsArticle } from "../../shared/schema";
import { MobileNewsCard } from "./MobileNewsCard";

interface MobileNewsCarouselProps {
    news: NewsArticle[];
    className?: string;
}

export function MobileNewsCarousel({ news, className }: MobileNewsCarouselProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState<"left" | "right">("right");
    const [dragRotation, setDragRotation] = useState(0);
    const currentNews = news[activeIndex];

    // Horizontal swipe variants with tilt effect (Bumble-style):
    const variants = {
        initial: (direction: "left" | "right") => ({
            opacity: 0,
            x: direction === "right" ? 100 : -100,
            rotate: direction === "right" ? -15 : 15,
            scale: 0.9,
        }),
        animate: { 
            opacity: 1, 
            x: 0, 
            rotate: 0,
            scale: 1,
        },
        exit: (direction: "left" | "right") => ({
            opacity: 0,
            x: direction === "right" ? -100 : 100,
            rotate: direction === "right" ? 15 : -15,
            scale: 0.8,
        }),
    };

    const handleDragEnd = useCallback(
        (_event: MouseEvent | TouchEvent, info: any) => {
            const swipeThreshold = 50; // Reduced threshold for better sensitivity
            const offsetX = info.offset.x;
            const velocityX = info.velocity.x;
            const swipePower = offsetX + velocityX * 0.1; // Reduced velocity multiplier

            if (swipePower > swipeThreshold) {
                // Swiped right: go to next article
                setDirection("right");
                setActiveIndex((prev) => (prev < news.length - 1 ? prev + 1 : 0));
            } else if (swipePower < -swipeThreshold) {
                // Swiped left: go to previous article
                setDirection("left");
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : news.length - 1));
            }
        },
        [news.length]
    );

    const handleDragStart = useCallback(() => {
        // Prevent any text selection or other interactions during drag
        document.body.style.userSelect = 'none';
    }, []);

    const handleDrag = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: any) => {
        // Keep preventing interactions during drag
        document.body.style.userSelect = 'none';
        
        // Calculate rotation based on drag offset (Bumble-style)
        const rotation = info.offset.x * 0.1; // Adjust multiplier for desired tilt amount
        setDragRotation(rotation);
    }, []);

    const resetUserSelect = useCallback(() => {
        // Reset user selection after drag ends
        document.body.style.userSelect = '';
        // Reset drag rotation
        setDragRotation(0);
    }, []);

    // Reset carousel to first article when news array changes (category filter change)
    useEffect(() => {
        setActiveIndex(0);
        setDragRotation(0);
    }, [news]);

    return (
        <div 
            className={`relative w-full h-full overflow-hidden ${className || ""}`}
            style={{ 
                touchAction: 'pan-x',
                userSelect: 'none'
            }}
        >
            <AnimatePresence initial={false} custom={direction}>
                <motion.div
                    key={currentNews?.id || activeIndex}
                    custom={direction}
                    variants={variants}
                    initial="initial"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.1}
                    dragMomentum={false}
                    onDragStart={handleDragStart}
                    onDrag={handleDrag}
                    onDragEnd={(event, info) => {
                        resetUserSelect();
                        handleDragEnd(event, info);
                    }}
                    className="w-full h-full cursor-grab active:cursor-grabbing"
                    style={{ 
                        touchAction: 'pan-x',
                        userSelect: 'none',
                        transformOrigin: 'center 85%'
                    }}
                    animate={{
                        ...variants.animate,
                        rotate: dragRotation,
                    }}
                >
                    <MobileNewsCard article={currentNews} />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
