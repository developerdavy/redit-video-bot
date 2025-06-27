interface RedditPost {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  ups: number;
  is_video: boolean;
  media?: {
    reddit_video?: {
      fallback_url: string;
      duration: number;
    };
  };
}

interface RedditResponse {
  data: {
    children: Array<{
      data: RedditPost;
    }>;
  };
}

export class RedditService {
  private async makeRequest(url: string): Promise<any> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ContentBot/1.0.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Reddit API error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  async getPopularVideos(subreddit: string, limit: number = 25): Promise<Array<{
    id: string;
    title: string;
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
    upvotes: number;
  }>> {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
      const data: RedditResponse = await this.makeRequest(url);
      
      const videos = data.data.children
        .map(child => child.data)
        .filter(post => post.is_video && post.media?.reddit_video)
        .map(post => ({
          id: post.id,
          title: post.title,
          videoUrl: post.media!.reddit_video!.fallback_url,
          thumbnailUrl: post.thumbnail !== 'self' ? post.thumbnail : '',
          duration: post.media!.reddit_video!.duration || 0,
          upvotes: post.ups
        }));

      return videos;
    } catch (error) {
      console.error(`Error fetching videos from r/${subreddit}:`, error);
      throw new Error(`Failed to fetch videos from r/${subreddit}: ${error.message}`);
    }
  }

  async checkSubredditExists(subreddit: string): Promise<boolean> {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/about.json`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ContentBot/1.0.0'
        }
      });
      
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const redditService = new RedditService();
