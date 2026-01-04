// src/data/fetchNewsData.ts
import axios from "axios";
import type { NewsArticle } from "../shared/schema";
import { NEWS_DATA_API_URL } from "../lib/apiConfig";

// API returns NewsArticle format (already transformed by repository), but dates are serialized as strings
interface SerializedNewsArticle {
    id: string; // Unique database ID
    news_number: number;
    title: string;
    imageUrl: string;
    category: string;
    publisher: string;
    description: string;
    date: string; // ISO date string from JSON serialization
    readMoreUrl: string;
}

const url = `${NEWS_DATA_API_URL}/api/news`;

export const fetchNewsData = async (): Promise<NewsArticle[]> => {
    try {
        const response = await axios.get(url);
        // API returns: { category: NewsArticle[] } (already transformed, but dates are strings)
        const data = response.data as Record<string, SerializedNewsArticle[]>;
        const articles: NewsArticle[] = [];

        Object.entries(data).forEach(([category, items]) => {
            items.forEach((item: SerializedNewsArticle) => {
                // Parse date string back to Date object
                const articleDate = item.date ? new Date(item.date) : new Date();
                
                articles.push({
                    id: item.id, // Unique database ID for React keys
                    news_number: item.news_number || 0,
                    title: item.title,
                    imageUrl: item.imageUrl || '',
                    category: item.category || category, // Use item.category if available, fallback to grouped category
                    publisher: item.publisher || 'Unknown',
                    description: item.description || '',
                    date: articleDate,
                    readMoreUrl: item.readMoreUrl || '#',
                });
            });
        });
        return articles;
    } catch (error) {
        console.error("Error fetching news data:", error);
        throw error;
    }
};
