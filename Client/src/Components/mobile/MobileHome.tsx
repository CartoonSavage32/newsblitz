import type { NewsArticle } from "@/shared/schema";
import { MobileBottomNavbar } from "./MobileBottomNavbar";
import { MobileFilterSheet } from "./MobileFilterSheet";
import { MobileNewsCarousel } from "./MobileNewsCarousel";
import { MobileTopNavbar } from "./MobileTopNavbar";

interface MobileHomeProps {
    filteredArticles: NewsArticle[];
    selectedCategory: string;
    onSelectCategory: (category: string) => void;
    isFilterOpen: boolean;
    onFilterOpenChange: (open: boolean) => void;
}

export function MobileHome({
    filteredArticles,
    selectedCategory,
    onSelectCategory,
    isFilterOpen,
    onFilterOpenChange,
}: MobileHomeProps) {
    return (
        <div className="h-[100dvh] flex flex-col bg-gradient-to-br from-blue-100/50 to-purple-100/50 dark:from-blue-950/50 dark:to-purple-950/50 touch-pan-y">
            <MobileTopNavbar onFilterOpen={() => onFilterOpenChange(true)} />
            <MobileFilterSheet
                isOpen={isFilterOpen}
                onOpenChange={onFilterOpenChange}
                selectedCategory={selectedCategory}
                onSelectCategory={onSelectCategory}
            />
            <main className="flex-1 pt-14 pb-16 overflow-hidden">
                <MobileNewsCarousel news={filteredArticles} />
            </main>
            <MobileBottomNavbar />
        </div>
    );
}
