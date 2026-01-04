// Frontend NewsArticle type (matches what the UI expects)
export interface NewsArticle {
    id: string; // Unique database ID for React keys
    news_number: number;
    title: string;
    imageUrl: string;
    category: string;
    publisher: string;
    description: string;
    date: Date;
    readMoreUrl: string;
}

