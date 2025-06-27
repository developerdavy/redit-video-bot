import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Settings, CheckCircle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ContentItem } from "@shared/schema";

export default function AIGenerator() {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contentItems = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ["/api/content-items"],
  });

  const pendingItems = contentItems.filter(item => item.status === "pending" && !item.aiDescription);
  const itemsWithDescriptions = contentItems.filter(item => item.aiDescription);

  const bulkGenerateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/bulk-generate-descriptions"),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: `Generated descriptions for ${response.processed} videos`
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate descriptions: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const selectiveGenerateMutation = useMutation({
    mutationFn: (contentItemIds: number[]) => 
      apiRequest("POST", "/api/generate-descriptions", { contentItemIds }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      const successCount = response.results.filter((r: any) => r.success).length;
      toast({
        title: "Success",
        description: `Generated descriptions for ${successCount} videos`
      });
      setSelectedItems([]);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate descriptions: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleSelectAll = () => {
    if (selectedItems.length === pendingItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(pendingItems.map(item => item.id));
    }
  };

  const handleItemToggle = (itemId: number) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-black">AI Generator</h2>
            <p className="text-gray-600">Generate engaging YouTube descriptions with AI</p>
          </div>
          <Button variant="outline">
            <Settings size={16} className="mr-2" />
            Configure AI
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 overflow-y-auto h-full">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* AI Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-accent-blue bg-opacity-10 rounded-full flex items-center justify-center">
                    <Brain className="text-accent-blue" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">AI Model</p>
                    <p className="font-semibold">Gemini 2.5 Flash</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-success-green bg-opacity-10 rounded-full flex items-center justify-center">
                    <CheckCircle className="text-success-green" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Generated Today</p>
                    <p className="font-semibold">{itemsWithDescriptions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-warning-yellow bg-opacity-10 rounded-full flex items-center justify-center">
                    <Clock className="text-warning-yellow" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="font-semibold">{pendingItems.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bulk Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Bulk Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600">
                  {pendingItems.length} videos need AI descriptions
                </p>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={handleSelectAll}
                    disabled={pendingItems.length === 0}
                  >
                    {selectedItems.length === pendingItems.length ? "Deselect All" : "Select All"}
                  </Button>
                  <Button
                    className="bg-success-green hover:bg-green-600"
                    onClick={() => bulkGenerateMutation.mutate()}
                    disabled={bulkGenerateMutation.isPending || pendingItems.length === 0}
                  >
                    <Zap size={16} className="mr-2" />
                    Generate All
                  </Button>
                </div>
              </div>
              
              {selectedItems.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-accent-blue bg-opacity-10 rounded-lg">
                  <p className="text-sm text-accent-blue">
                    {selectedItems.length} videos selected
                  </p>
                  <Button
                    size="sm"
                    className="bg-accent-blue hover:bg-blue-700"
                    onClick={() => selectiveGenerateMutation.mutate(selectedItems)}
                    disabled={selectiveGenerateMutation.isPending}
                  >
                    Generate Selected
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Items */}
          <Card>
            <CardHeader>
              <CardTitle>Videos Pending AI Description</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading videos...</p>
                </div>
              ) : pendingItems.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">All videos have AI descriptions!</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Fetch more content from Reddit to generate new descriptions
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingItems.map((item) => (
                    <div 
                      key={item.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedItems.includes(item.id) 
                          ? "border-accent-blue bg-accent-blue bg-opacity-5" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleItemToggle(item.id)}
                    >
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleItemToggle(item.id)}
                          className="mt-1"
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        <div className="flex-shrink-0">
                          <div className="w-20 h-12 bg-gray-200 rounded overflow-hidden">
                            {item.thumbnailUrl && (
                              <img 
                                src={item.thumbnailUrl} 
                                alt={item.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-text-black truncate">
                            {item.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {item.upvotes.toLocaleString()} upvotes • {item.duration}s
                          </p>
                          <Badge variant="secondary" className="mt-2 bg-warning-yellow bg-opacity-20 text-warning-yellow">
                            <Clock size={12} className="mr-1" />
                            Needs Description
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Generations */}
          <Card>
            <CardHeader>
              <CardTitle>Recently Generated Descriptions</CardTitle>
            </CardHeader>
            <CardContent>
              {itemsWithDescriptions.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No AI descriptions generated yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {itemsWithDescriptions.slice(0, 5).map((item) => (
                    <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-20 h-12 bg-gray-200 rounded overflow-hidden">
                            {item.thumbnailUrl && (
                              <img 
                                src={item.thumbnailUrl} 
                                alt={item.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-text-black truncate">
                            {item.title}
                          </h4>
                          <Textarea
                            value={item.aiDescription || ""}
                            readOnly
                            className="mt-2 text-sm"
                            rows={3}
                          />
                          <Badge variant="secondary" className="mt-2 bg-success-green bg-opacity-20 text-success-green">
                            <CheckCircle size={12} className="mr-1" />
                            Generated
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
