"use client";

import { DesktopHome } from "@/components/desktop/DesktopHome";
import { MobileHome } from "@/components/mobile/MobileHome";
import { useMediaQuery } from "@/hooks/useMobile";
import { useNews } from "@/hooks/useNews";
import type { NewsArticle } from "@/shared/schema";
import { useMemo, useState } from "react";

export default function News() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: articles, isLoading } = useNews();

  // Stable shuffle function for "All" category - mixes articles from all categories
  // Must be called before any early returns to follow Rules of Hooks
  const shuffledAllArticles = useMemo(() => {
    if (!articles) return [];

    // Deduplicate by id to ensure no repeats
    const uniqueArticles = new Map<string, NewsArticle>();
    articles.forEach((article) => {
      if (!uniqueArticles.has(article.id)) {
        uniqueArticles.set(article.id, article);
      }
    });

    const allArticles = Array.from(uniqueArticles.values());

    // Fisher-Yates shuffle for stable randomization
    const shuffled = [...allArticles];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }, [articles]);

  // Filter articles by selected category (case-insensitive comparison)
  // Must be called before any early returns to follow Rules of Hooks
  const filteredArticles = useMemo(() => {
    if (!articles) return [];

    if (selectedCategory === "All") {
      // Return shuffled mix of all articles for "All" tab
      return shuffledAllArticles;
    }
    // For specific categories, return filtered list in original order (no shuffle)
    return articles.filter((article) => {
      return article.category?.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
    });
  }, [selectedCategory, articles, shuffledAllArticles]);

  if (isLoading || !articles) {
    return (
      <div className="fixed inset-0 flex items-center justify-center w-full h-screen bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }


  return isMobile ? (
    <MobileHome
      filteredArticles={filteredArticles}
      selectedCategory={selectedCategory}
      onSelectCategory={setSelectedCategory}
      isFilterOpen={isFilterOpen}
      onFilterOpenChange={setIsFilterOpen}
    />
  ) : (
    <div className="relative h-full overflow-hidden">
      {/* Background Pattern - Full page coverage */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#6b7280_1px,transparent_1px)] [background-size:16px_16px] opacity-60"></div>

      <DesktopHome
        filteredArticles={filteredArticles}
        selectedCategory={selectedCategory}
        onFilterChange={setSelectedCategory}
      />
    </div>
  );
}

