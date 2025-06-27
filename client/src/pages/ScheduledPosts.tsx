import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Play, Pause, Edit, Trash2 } from "lucide-react";
import type { ContentItem } from "@shared/schema";

export default function ScheduledPosts() {
  const { data: contentItems = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content-items"]
  });

  const scheduledItems = contentItems.filter(item => 
    item.status === "approved" && item.scheduledAt
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getTimeUntilPost = (scheduledAt: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diffInHours = Math.ceil((scheduled.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 0) return "Overdue";
    if (diffInHours < 1) return "Less than 1 hour";
    if (diffInHours < 24) return `${diffInHours} hours`;
    
    const days = Math.ceil(diffInHours / 24);
    return `${days} days`;
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-black">Scheduled Posts</h2>
            <p className="text-gray-600">Manage your scheduled YouTube uploads</p>
          </div>
          <Button className="bg-success-green hover:bg-green-600">
            <Calendar size={16} className="mr-2" />
            Schedule New Post
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 overflow-y-auto h-full">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 text-accent-blue mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-black">{scheduledItems.length}</p>
                <p className="text-sm text-gray-600">Scheduled Posts</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 text-warning-yellow mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-black">
                  {scheduledItems.filter(item => {
                    const scheduled = new Date(item.scheduledAt!);
                    const now = new Date();
                    return scheduled < now;
                  }).length}
                </p>
                <p className="text-sm text-gray-600">Overdue</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <Play className="h-8 w-8 text-success-green mx-auto mb-2" />
                <p className="text-2xl font-bold text-text-black">
                  {scheduledItems.filter(item => {
                    const scheduled = new Date(item.scheduledAt!);
                    const now = new Date();
                    const diffInHours = (scheduled.getTime() - now.getTime()) / (1000 * 60 * 60);
                    return diffInHours <= 24 && diffInHours > 0;
                  }).length}
                </p>
                <p className="text-sm text-gray-600">Next 24 Hours</p>
              </CardContent>
            </Card>
          </div>

          {/* Scheduled Items */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading scheduled posts...</p>
                </div>
              ) : scheduledItems.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No posts scheduled</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Schedule approved videos to automate your YouTube uploads
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scheduledItems
                    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
                    .map((item) => {
                      const isOverdue = new Date(item.scheduledAt!) < new Date();
                      
                      return (
                        <div 
                          key={item.id}
                          className={`p-4 border rounded-lg ${
                            isOverdue ? "border-error-red bg-red-50" : "border-gray-200"
                          }`}
                        >
                          <div className="flex items-start space-x-4">
                            {/* Thumbnail */}
                            <div className="flex-shrink-0">
                              <div className="w-24 h-16 bg-gray-200 rounded-lg overflow-hidden relative">
                                {item.thumbnailUrl ? (
                                  <img 
                                    src={item.thumbnailUrl} 
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                    <Play size={20} className="text-gray-500" />
                                  </div>
                                )}
                                {item.duration && (
                                  <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                                    {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-text-black truncate">
                                {item.title}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {item.upvotes.toLocaleString()} upvotes • Source ID: {item.redditSourceId}
                              </p>
                              
                              {item.aiDescription && (
                                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                  {item.aiDescription}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-2 mt-3">
                                <Badge 
                                  variant="secondary"
                                  className={isOverdue 
                                    ? "bg-error-red bg-opacity-20 text-error-red"
                                    : "bg-accent-blue bg-opacity-20 text-accent-blue"
                                  }
                                >
                                  <Clock size={12} className="mr-1" />
                                  {isOverdue ? "Overdue" : getTimeUntilPost(item.scheduledAt!)}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  Scheduled for {formatDate(item.scheduledAt!)}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex-shrink-0 flex items-center space-x-2">
                              <Button variant="ghost" size="sm" className="text-accent-blue hover:bg-blue-50">
                                <Edit size={16} />
                              </Button>
                              
                              <Button variant="ghost" size="sm" className="text-success-green hover:bg-green-50">
                                <Play size={16} />
                              </Button>
                              
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-gray-50">
                                <Pause size={16} />
                              </Button>
                              
                              <Button variant="ghost" size="sm" className="text-error-red hover:bg-red-50">
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Schedule Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="p-4 h-auto flex-col">
                  <Clock className="h-6 w-6 mb-2" />
                  <span className="font-medium">Daily at 3 PM</span>
                  <span className="text-xs text-gray-500">Best engagement time</span>
                </Button>
                
                <Button variant="outline" className="p-4 h-auto flex-col">
                  <Calendar className="h-6 w-6 mb-2" />
                  <span className="font-medium">Weekends Only</span>
                  <span className="text-xs text-gray-500">Saturday & Sunday</span>
                </Button>
                
                <Button variant="outline" className="p-4 h-auto flex-col">
                  <Play className="h-6 w-6 mb-2" />
                  <span className="font-medium">Peak Hours</span>
                  <span className="text-xs text-gray-500">6-8 PM daily</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
