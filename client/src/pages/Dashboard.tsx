import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatsCard from "@/components/StatsCard";
import ContentCard from "@/components/ContentCard";
import { 
  Newspaper, 
  CheckCircle, 
  Clock, 
  Plus, 
  Bell, 
  RefreshCw, 
  Upload,
  Bot,
  Brain,
  Download,
  Hash
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ContentItem, NewsSource } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery<{
    articlesGenerated: number;
    newsSources: number;
    successRate: number;
    queueLength: number;
  }>({
    queryKey: ["/api/stats"]
  });

  const { data: contentItems = [], isLoading: contentLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content-items"]
  });

  const { data: newsSources = [], isLoading: sourcesLoading } = useQuery<NewsSource[]>({
    queryKey: ["/api/news-sources"]
  });

  // Generate AI descriptions for pending items
  const generateAIMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/bulk-generate-descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (!response.ok) throw new Error("Failed to generate descriptions");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "AI Descriptions Generated!",
        description: `Generated descriptions for ${data.processed} videos using Gemini AI.`
      });
      queryClient.invalidateQueries({ queryKey: ["/api/content-items"] });
    },
    onError: (error) => {
      toast({
        title: "AI Generation Failed",
        description: "Failed to generate AI descriptions. Please check your Gemini API key.",
        variant: "destructive"
      });
    }
  });

  const recentItems = contentItems.slice(0, 3);

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome to ContentBot - Your YouTube Automation Platform</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => generateAIMutation.mutate()}
              disabled={generateAIMutation.isPending}
              variant="outline"
            >
              <Brain className="mr-2 h-4 w-4" />
              {generateAIMutation.isPending ? "Generating..." : "Generate AI Descriptions"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Stats Section */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Articles Generated"
            value={statsLoading ? "..." : (stats?.articlesGenerated || 0)}
            icon={<Newspaper className="text-white" />}
            iconBgColor="bg-youtube-red"
            trend={{
              value: "+12%",
              label: "from last week",
              positive: true
            }}
          />
          <StatsCard
            title="News Sources"
            value={statsLoading ? "..." : newsSources.length}
            icon={<Newspaper className="text-white" />}
            iconBgColor="bg-black"
            trend={{
              value: "+2",
              label: "new sources",
              positive: true
            }}
          />
          <StatsCard
            title="Success Rate"
            value={statsLoading ? "..." : `${stats?.successRate || 85}%`}
            icon={<CheckCircle className="text-white" />}
            iconBgColor="bg-green-500"
            trend={{
              value: "+5%",
              label: "from last month",
              positive: true
            }}
          />
          <StatsCard
            title="Queue Length"
            value={statsLoading ? "..." : (stats?.queueLength || contentItems.length)}
            icon={<Clock className="text-white" />}
            iconBgColor="bg-orange-500"
            trend={{
              value: "3",
              label: "pending approval",
              positive: false
            }}
          />
        </div>

        {/* Action Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <RefreshCw className="mr-2 h-5 w-5" />
                TikTok Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Fetch trending content from your TikTok hashtag sources
              </p>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/tiktok-sources'}
              >
                <Hash className="mr-2 h-4 w-4" />
                Manage TikTok Sources
              </Button>
            </CardContent>
          </Card>

          {/* Content Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Newspaper className="mr-2 h-5 w-5" />
                Active Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sourcesLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : newsSources.length === 0 ? (
                <div className="text-center py-4">
                  <Newspaper className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-3">No news sources configured</p>
                  <Button 
                    size="sm" 
                    onClick={() => window.location.href = '/news-sources'}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Source
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {newsSources.slice(0, 3).map((source: NewsSource) => (
                    <div key={source.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center">
                        <Newspaper className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium">{source.category}</span>
                      </div>
                      <Badge variant={source.isActive ? "default" : "secondary"}>
                        {source.isActive ? "Active" : "Paused"}
                      </Badge>
                    </div>
                  ))}
                  {newsSources.length > 3 && (
                    <p className="text-xs text-gray-500 mt-2">
                      +{newsSources.length - 3} more sources
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Bot className="mr-2 h-5 w-5" />
                AI Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Generate YouTube descriptions using Gemini AI
              </p>
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/ai-generator'}
                variant="outline"
              >
                <Brain className="mr-2 h-4 w-4" />
                Open AI Generator
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-lg">
                <Newspaper className="mr-2 h-5 w-5" />
                Recent Content
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/preview-queue'}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {contentLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex space-x-4">
                    <div className="rounded bg-gray-200 h-20 w-32"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentItems.length === 0 ? (
              <div className="text-center py-8">
                <Newspaper className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No content yet</h3>
                <p className="text-gray-600 mb-4">
                  Start by adding news sources to fetch trending articles
                </p>
                <Button onClick={() => window.location.href = '/news-sources'}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add News Source
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentItems.map((item) => (
                  <ContentCard
                    key={item.id}
                    id={item.id}
                    title={item.title}
                    source={item.sourceName}
                    content={item.content}
                    url={item.url}
                    imageUrl={item.imageUrl || undefined}
                    publishedAt={item.publishedAt ? new Date(item.publishedAt).toISOString() : undefined}
                    aiDescription={item.aiDescription || undefined}
                    status={item.status}
                    scheduledAt={item.scheduledAt ? new Date(item.scheduledAt).toISOString() : undefined}
                    createdAt={new Date(item.createdAt).toISOString()}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}