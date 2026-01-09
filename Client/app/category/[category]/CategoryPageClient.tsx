"use client";

import { DesktopHome } from "@/components/news/DesktopHome";
import { MobileHome } from "@/components/news/MobileHome";
import { useMediaQuery } from "@/hooks/useMobile";
import type { NewsArticle } from "@/lib/schema";

interface CategoryPageClientProps {
  articles: NewsArticle[];
  categoryName: string;
  categorySlug: string;
}

export function CategoryPageClient({ articles, categoryName }: CategoryPageClientProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? (
    <MobileHome
      filteredArticles={articles}
      selectedCategory={categoryName}
      onSelectCategory={() => {}}
      isFilterOpen={false}
      onFilterOpenChange={() => {}}
    />
  ) : (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#6b7280_1px,transparent_1px)] [background-size:16px_16px] opacity-60"></div>
      <DesktopHome
        filteredArticles={articles}
        selectedCategory={categoryName}
        onFilterChange={() => {}}
      />
    </div>
  );
}

