import { useQuery } from "@tanstack/react-query";
import { fetchNewsData } from "@/data/newsData";
import type { NewsArticle } from "@/lib/schema";

export function useNews() {
    return useQuery<NewsArticle[]>({
        queryKey: ["newsData"],
        queryFn: fetchNewsData,
    });
}

