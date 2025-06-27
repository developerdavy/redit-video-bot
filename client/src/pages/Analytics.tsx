import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  ThumbsUp, 
  MessageCircle, 
  Share,
  Calendar,
  Download
} from "lucide-react";
import type { ContentItem } from "@shared/schema";

export default function Analytics() {
  const { data: contentItems = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content-items"]
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"]
  });

  // Mock analytics data since we don't have YouTube API connected yet
  const mockAnalytics = {
    totalViews: 247890,
    totalLikes: 18340,
    totalComments: 2847,
    totalShares: 924,
    avgEngagementRate: 7.4,
    topPerformingVideos: [
      { title: "Hilarious Cat Reaction to Cucumber Prank", views: 45200, likes: 3240 },
      { title: "Dog's Epic Water Balloon Fight Fail", views: 38900, likes: 2810 },
      { title: "Most Unexpected Plot Twist Ever", views: 32100, likes: 2290 }
    ],
    performanceBySource: [
      { source: "r/funny", videos: 45, avgViews: 15230 },
      { source: "r/AnimalsBeingDerps", videos: 32, avgViews: 18940 },
      { source: "r/Unexpected", videos: 28, avgViews: 12450 }
    ]
  };

  const getPerformanceMetrics = () => {
    const totalVideos = contentItems.length;
    const approvedVideos = contentItems.filter(item => item.status === "approved" || item.status === "posted").length;
    const successRate = totalVideos > 0 ? (approvedVideos / totalVideos) * 100 : 0;
    
    return {
      totalVideos,
      approvedVideos,
      successRate: successRate.toFixed(1)
    };
  };

  const metrics = getPerformanceMetrics();

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-black">Analytics</h2>
            <p className="text-gray-600">Track your content performance and engagement</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Calendar size={16} className="mr-2" />
              Last 30 Days
            </Button>
            <Button variant="outline">
              <Download size={16} className="mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 overflow-y-auto h-full">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-text-black">
                      {mockAnalytics.totalViews.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-youtube-red bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Eye className="text-youtube-red" size={20} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="text-success-green mr-1" size={16} />
                  <span className="text-success-green">+12.5%</span>
                  <span className="text-gray-600 ml-2">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Likes</p>
                    <p className="text-2xl font-bold text-text-black">
                      {mockAnalytics.totalLikes.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-success-green bg-opacity-10 rounded-lg flex items-center justify-center">
                    <ThumbsUp className="text-success-green" size={20} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="text-success-green mr-1" size={16} />
                  <span className="text-success-green">+8.3%</span>
                  <span className="text-gray-600 ml-2">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Comments</p>
                    <p className="text-2xl font-bold text-text-black">
                      {mockAnalytics.totalComments.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-accent-blue bg-opacity-10 rounded-lg flex items-center justify-center">
                    <MessageCircle className="text-accent-blue" size={20} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingDown className="text-error-red mr-1" size={16} />
                  <span className="text-error-red">-2.1%</span>
                  <span className="text-gray-600 ml-2">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Engagement Rate</p>
                    <p className="text-2xl font-bold text-text-black">
                      {mockAnalytics.avgEngagementRate}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-warning-yellow bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Share className="text-warning-yellow" size={20} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="text-success-green mr-1" size={16} />
                  <span className="text-success-green">+0.8%</span>
                  <span className="text-gray-600 ml-2">from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Content Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Videos Generated</span>
                    <span className="font-medium">{metrics.totalVideos}</span>
                  </div>
                  <Progress value={(metrics.totalVideos / 300) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Approval Rate</span>
                    <span className="font-medium">{metrics.successRate}%</span>
                  </div>
                  <Progress value={parseFloat(metrics.successRate)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Upload Success</span>
                    <span className="font-medium">94.2%</span>
                  </div>
                  <Progress value={94.2} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>AI Description Quality</span>
                    <span className="font-medium">87.6%</span>
                  </div>
                  <Progress value={87.6} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Top Performing Videos */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Videos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAnalytics.topPerformingVideos.map((video, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{video.title}</p>
                        <p className="text-xs text-gray-500">
                          {video.views.toLocaleString()} views • {video.likes.toLocaleString()} likes
                        </p>
                      </div>
                      <div className="flex items-center text-success-green">
                        <TrendingUp size={16} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Source Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Performance by Reddit Source</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading analytics...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {mockAnalytics.performanceBySource.map((source, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{source.source}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{source.videos} videos</span>
                          <span>{source.avgViews.toLocaleString()} avg views</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                        <div>
                          <p className="text-gray-600">Success Rate</p>
                          <p className="font-medium text-success-green">
                            {85 + index * 3}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Avg Engagement</p>
                          <p className="font-medium">
                            {6.2 + index * 0.4}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Views</p>
                          <p className="font-medium">
                            {(source.videos * source.avgViews).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Growth Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Growth Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-youtube-red bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="text-youtube-red" size={24} />
                  </div>
                  <p className="text-2xl font-bold text-text-black mb-1">+127%</p>
                  <p className="text-sm text-gray-600">Subscriber Growth</p>
                  <p className="text-xs text-gray-500 mt-1">vs. previous month</p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 bg-success-green bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Eye className="text-success-green" size={24} />
                  </div>
                  <p className="text-2xl font-bold text-text-black mb-1">+89%</p>
                  <p className="text-sm text-gray-600">View Time</p>
                  <p className="text-xs text-gray-500 mt-1">vs. previous month</p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 bg-accent-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ThumbsUp className="text-accent-blue" size={24} />
                  </div>
                  <p className="text-2xl font-bold text-text-black mb-1">+156%</p>
                  <p className="text-sm text-gray-600">Engagement</p>
                  <p className="text-xs text-gray-500 mt-1">vs. previous month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
