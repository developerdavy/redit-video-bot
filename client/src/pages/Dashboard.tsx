import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatsCard from "@/components/StatsCard";
import ContentCard from "@/components/ContentCard";
import { 
  Video, 
  CheckCircle, 
  Clock, 
  Plus, 
  Bell, 
  RefreshCw, 
  Upload,
  Bot,
  Brain
} from "lucide-react";
import { FaReddit } from "react-icons/fa";
import type { ContentItem } from "@shared/schema";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"]
  });

  const { data: contentItems = [], isLoading: contentLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content-items"]
  });

  const { data: redditSources = [], isLoading: sourcesLoading } = useQuery({
    queryKey: ["/api/reddit-sources"]
  });

  const recentItems = contentItems.slice(0, 3);

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-black">Dashboard</h2>
            <p className="text-gray-600">Manage your YouTube content automation</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button className="bg-success-green hover:bg-green-600 text-white">
              <Plus size={16} className="mr-2" />
              New Campaign
            </Button>
            <div className="relative">
              <Button variant="ghost" size="sm">
                <Bell size={16} />
              </Button>
              <span className="absolute -top-1 -right-1 bg-youtube-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 overflow-y-auto h-full">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Videos Generated"
            value={statsLoading ? "..." : stats?.videosGenerated || 0}
            icon={<Video className="text-youtube-red" size={20} />}
            trend={{
              value: "+12%",
              label: "from last month",
              positive: true
            }}
            iconBgColor="bg-youtube-red bg-opacity-10"
          />
          
          <StatsCard
            title="Reddit Sources"
            value={statsLoading ? "..." : stats?.redditSources || 0}
            icon={<FaReddit className="text-orange-500" size={20} />}
            trend={{
              value: "+2",
              label: "new this week",
              positive: true
            }}
            iconBgColor="bg-orange-100"
          />
          
          <StatsCard
            title="Success Rate"
            value={statsLoading ? "..." : `${(stats?.successRate || 0).toFixed(1)}%`}
            icon={<CheckCircle className="text-success-green" size={20} />}
            trend={{
              value: "+1.3%",
              label: "improvement",
              positive: true
            }}
            iconBgColor="bg-success-green bg-opacity-10"
          />
          
          <StatsCard
            title="Queue Length"
            value={statsLoading ? "..." : stats?.queueLength || 0}
            icon={<Clock className="text-accent-blue" size={20} />}
            trend={{
              value: "Ready to post",
              label: "",
              positive: true
            }}
            iconBgColor="bg-accent-blue bg-opacity-10"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content Queue */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Content Queue</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="text-accent-blue">
                      View All
                    </Button>
                    <Button variant="ghost" size="sm">
                      <RefreshCw size={16} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {contentLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading content...</p>
                  </div>
                ) : recentItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No content items yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Fetch some videos from Reddit to get started
                    </p>
                  </div>
                ) : (
                  recentItems.map((item) => (
                    <ContentCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      source={item.redditSourceId.toString()} // This should be the subreddit name
                      upvotes={item.upvotes}
                      aiDescription={item.aiDescription || undefined}
                      status={item.status}
                      thumbnailUrl={item.thumbnailUrl || undefined}
                      duration={item.duration || undefined}
                      scheduledAt={item.scheduledAt?.toString()}
                      createdAt={item.createdAt.toString()}
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-6">
            {/* Active Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Active Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sourcesLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-blue mx-auto"></div>
                  </div>
                ) : redditSources.length === 0 ? (
                  <div className="text-center py-4">
                    <FaReddit className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No Reddit sources</p>
                  </div>
                ) : (
                  redditSources.map((source: any) => (
                    <div key={source.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FaReddit className="text-orange-500" size={16} />
                        <span className="text-sm font-medium">r/{source.subreddit}</span>
                      </div>
                      <Badge 
                        variant="secondary"
                        className={source.isActive 
                          ? "bg-success-green bg-opacity-20 text-success-green" 
                          : "bg-warning-yellow bg-opacity-20 text-warning-yellow"
                        }
                      >
                        <div className={`w-2 h-2 rounded-full mr-1 ${
                          source.isActive ? "bg-success-green" : "bg-warning-yellow"
                        }`}></div>
                        {source.isActive ? "Active" : "Paused"}
                      </Badge>
                    </div>
                  ))
                )}
                <Button variant="outline" className="w-full mt-4" size="sm">
                  <Plus size={16} className="mr-2" />
                  Add New Source
                </Button>
              </CardContent>
            </Card>

            {/* AI Generation Status */}
            <Card>
              <CardHeader>
                <CardTitle>AI Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="w-16 h-16 bg-accent-blue bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="text-accent-blue" size={24} />
                  </div>
                  <h4 className="font-medium text-text-black mb-2">AI Status</h4>
                  <p className="text-sm text-gray-600 mb-4">Google Gemini 2.5 Flash connected and ready</p>
                  <div className="bg-light-grey rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">API Usage</span>
                      <span className="font-medium">67%</span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-2 mt-2">
                      <div className="bg-accent-blue h-2 rounded-full" style={{ width: "67%" }}></div>
                    </div>
                  </div>
                  <Button className="w-full bg-accent-blue hover:bg-blue-700">
                    Configure AI
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-youtube-red hover:bg-red-700 text-white">
                  <RefreshCw size={16} className="mr-2" />
                  Refresh Reddit Feed
                </Button>
                <Button variant="outline" className="w-full">
                  <Bot size={16} className="mr-2" />
                  Bulk Generate
                </Button>
                <Button variant="outline" className="w-full">
                  <Upload size={16} className="mr-2" />
                  Post to YouTube
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
