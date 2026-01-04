// components/desktop/DesktopHome.tsx
import type { NewsArticle } from "@/shared/schema";
import Filter from "../Filter";
import { NewsCarousel } from "./NewsCarousel";

interface DesktopHomeProps {
    filteredArticles: NewsArticle[];
    selectedCategory: string;
    onFilterChange: (category: string) => void;
}

export function DesktopHome({
    filteredArticles,
    selectedCategory,
    onFilterChange,
}: DesktopHomeProps) {
    return (
        <div className="h-full px-8 py-6 space-y-4 flex flex-col overflow-hidden">
            <div className="flex justify-center shrink-0">
                <Filter selectedCategory={selectedCategory} onFilterChange={onFilterChange} />
            </div>
            <div className="flex justify-center flex-1 min-h-0">
                <div className="w-full max-w-[85vw] h-full min-[1800px]:h-[75%] rounded-xl overflow-hidden border bg-card">
                    <NewsCarousel articles={filteredArticles} />
                </div>
            </div>
        </div>
    );
}
