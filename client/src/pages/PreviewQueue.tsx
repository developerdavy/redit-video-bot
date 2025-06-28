import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContentCard from "@/components/ContentCard";
import { Eye, Filter, RefreshCw } from "lucide-react";
import type { ContentItem } from "@shared/schema";

export default function PreviewQueue() {
  const { data: contentItems = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content-items"]
  });

  const pendingItems = contentItems.filter(item => item.status === "pending");
  const approvedItems = contentItems.filter(item => item.status === "approved");
  const rejectedItems = contentItems.filter(item => item.status === "rejected");

  const getStatusCounts = () => ({
    pending: pendingItems.length,
    approved: approvedItems.length,
    rejected: rejectedItems.length,
    total: contentItems.length
  });

  const counts = getStatusCounts();

  const renderContentList = (items: ContentItem[], emptyMessage: string) => {
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading content...</p>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-8">
          <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((item) => (
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
    );
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-black">Preview Queue</h2>
            <p className="text-gray-600">Review and manage your content before posting</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Filter size={16} className="mr-2" />
              Filter
            </Button>
            <Button variant="outline">
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 overflow-y-auto h-full">
        <div className="max-w-6xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-text-black">{counts.total}</p>
                <p className="text-sm text-gray-600">Total Videos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-warning-yellow">{counts.pending}</p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-success-green">{counts.approved}</p>
                <p className="text-sm text-gray-600">Approved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-error-red">{counts.rejected}</p>
                <p className="text-sm text-gray-600">Rejected</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="relative">
                All
                {counts.total > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                    {counts.total}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="pending" className="relative">
                Pending
                {counts.pending > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs bg-warning-yellow bg-opacity-20 text-warning-yellow">
                    {counts.pending}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="relative">
                Approved
                {counts.approved > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs bg-success-green bg-opacity-20 text-success-green">
                    {counts.approved}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="rejected" className="relative">
                Rejected
                {counts.rejected > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs bg-error-red bg-opacity-20 text-error-red">
                    {counts.rejected}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Content ({counts.total})</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderContentList(contentItems, "No content items found")}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pending" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Review ({counts.pending})</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderContentList(pendingItems, "No pending items")}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="approved" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Approved ({counts.approved})</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderContentList(approvedItems, "No approved items")}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Rejected ({counts.rejected})</CardTitle>
                </CardHeader>
                <CardContent>
                  {renderContentList(rejectedItems, "No rejected items")}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
