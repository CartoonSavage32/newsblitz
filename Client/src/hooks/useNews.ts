import { useQuery } from "@tanstack/react-query";
import { fetchNewsData } from "@/Data/newsData";
import type { NewsArticle } from "../shared/schema";

export function useNews() {
    return useQuery<NewsArticle[]>({
        queryKey: ["newsData"],
        queryFn: fetchNewsData,
    });
}
