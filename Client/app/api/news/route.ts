import { NextResponse } from 'next/server';
import { getAllNews } from '../../../lib/news/repository';

export async function GET() {
  try {
    const news = await getAllNews();
    
    // Transform to match frontend expectations (grouped by category)
    // Frontend expects: { category: Article[] }
    const groupedNews: Record<string, typeof news> = {};
    
    for (const article of news) {
      const category = article.category || 'All';
      if (!groupedNews[category]) {
        groupedNews[category] = [];
      }
      groupedNews[category].push(article);
    }

    return NextResponse.json(groupedNews);
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

