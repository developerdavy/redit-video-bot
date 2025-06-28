interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
}

export class NewsService {
  private apiKey: string;
  private baseUrl = 'https://newsapi.org/v2';

  constructor() {
    this.apiKey = process.env.NEWS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('NEWS_API_KEY not found in environment variables');
    }
  }

  private async makeRequest(endpoint: string): Promise<NewsApiResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'X-API-Key': this.apiKey,
          'User-Agent': 'ContentBot/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`NewsAPI request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('NewsAPI request error:', error);
      throw error;
    }
  }

  async getTopHeadlines(category: string, country: string = 'us', keywords?: string, limit: number = 25): Promise<Array<{
    id: string;
    title: string;
    content: string;
    url: string;
    imageUrl: string | null;
    publishedAt: string;
    source: string;
  }>> {
    try {
      console.log(`Fetching news articles for category: ${category}, country: ${country}, keywords: ${keywords || 'none'}`);
      
      let endpoint = `/top-headlines?country=${country}&pageSize=${limit}`;
      
      if (category && category !== 'general') {
        endpoint += `&category=${category}`;
      }
      
      if (keywords) {
        endpoint += `&q=${encodeURIComponent(keywords)}`;
      }

      const data = await this.makeRequest(endpoint);
      
      if (!data.articles || data.articles.length === 0) {
        console.log('No articles found in NewsAPI response');
        return [];
      }

      return data.articles
        .filter(article => article.title && article.url && article.title !== '[Removed]')
        .slice(0, limit)
        .map(article => ({
          id: article.url, // Use URL as unique identifier
          title: article.title,
          content: article.description || article.content || '',
          url: article.url,
          imageUrl: article.urlToImage,
          publishedAt: article.publishedAt,
          source: article.source.name
        }));
    } catch (error) {
      console.error('Error fetching news articles:', error);
      throw new Error(`Failed to fetch news articles: ${error}`);
    }
  }

  async searchEverything(keywords: string, limit: number = 25): Promise<Array<{
    id: string;
    title: string;
    content: string;
    url: string;
    imageUrl: string | null;
    publishedAt: string;
    source: string;
  }>> {
    try {
      console.log(`Searching news articles for keywords: ${keywords}`);
      
      const endpoint = `/everything?q=${encodeURIComponent(keywords)}&pageSize=${limit}&sortBy=publishedAt`;
      const data = await this.makeRequest(endpoint);
      
      if (!data.articles || data.articles.length === 0) {
        console.log('No articles found in search results');
        return [];
      }

      return data.articles
        .filter(article => article.title && article.url && article.title !== '[Removed]')
        .slice(0, limit)
        .map(article => ({
          id: article.url,
          title: article.title,
          content: article.description || article.content || '',
          url: article.url,
          imageUrl: article.urlToImage,
          publishedAt: article.publishedAt,
          source: article.source.name
        }));
    } catch (error) {
      console.error('Error searching news articles:', error);
      throw new Error(`Failed to search news articles: ${error}`);
    }
  }

  async checkCategoryExists(category: string): Promise<boolean> {
    const validCategories = [
      'business', 'entertainment', 'general', 'health', 
      'science', 'sports', 'technology'
    ];
    return validCategories.includes(category.toLowerCase());
  }

  getValidCategories(): string[] {
    return [
      'business', 'entertainment', 'general', 'health', 
      'science', 'sports', 'technology'
    ];
  }

  getValidCountries(): Array<{code: string, name: string}> {
    return [
      { code: 'us', name: 'United States' },
      { code: 'gb', name: 'United Kingdom' },
      { code: 'ca', name: 'Canada' },
      { code: 'au', name: 'Australia' },
      { code: 'de', name: 'Germany' },
      { code: 'fr', name: 'France' },
      { code: 'jp', name: 'Japan' },
      { code: 'in', name: 'India' },
      { code: 'cn', name: 'China' },
      { code: 'br', name: 'Brazil' }
    ];
  }
}

export const newsService = new NewsService();