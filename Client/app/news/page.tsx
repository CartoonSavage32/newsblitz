"use client";

import { DesktopHome } from "@/components/news/DesktopHome";
import { MobileHome } from "@/components/news/MobileHome";
import { useMediaQuery } from "@/hooks/useMobile";
import { useNews } from "@/hooks/useNews";
import type { NewsArticle } from "@/lib/schema";
import { useMemo, useState } from "react";

export default function News() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { data: articles, isLoading } = useNews();

  // Deduplicate and sort by date DESC (newest first)
  const sortedAllArticles = useMemo(() => {
    if (!articles) return [];

    const uniqueArticles = new Map<string, NewsArticle>();
    articles.forEach((article) => {
      if (!uniqueArticles.has(article.id)) {
        uniqueArticles.set(article.id, article);
      }
    });

    return Array.from(uniqueArticles.values()).sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
      const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [articles]);

  // Filter by category, sort by date DESC
  const filteredArticles = useMemo(() => {
    if (!articles) return [];

    if (selectedCategory === "All") {
      return sortedAllArticles;
    }

    const categoryArticles = articles.filter((article) => {
      return article.category?.toLowerCase().trim() === selectedCategory.toLowerCase().trim();
    });

    return categoryArticles.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
      const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [selectedCategory, articles, sortedAllArticles]);

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
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#6b7280_1px,transparent_1px)] [background-size:16px_16px] opacity-60"></div>
      <DesktopHome
        filteredArticles={filteredArticles}
        selectedCategory={selectedCategory}
        onFilterChange={setSelectedCategory}
      />
    </div>
  );
}
