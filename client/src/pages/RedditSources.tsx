import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Play, Pause } from "lucide-react";
import { FaReddit } from "react-icons/fa";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function RedditSources() {
  const [newSubreddit, setNewSubreddit] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["/api/reddit-sources"]
  });

  const addSourceMutation = useMutation({
    mutationFn: (subreddit: string) => 
      apiRequest("POST", "/api/reddit-sources", { subreddit }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reddit-sources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setNewSubreddit("");
      toast({
        title: "Success",
        description: "Reddit source added successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add Reddit source: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const toggleSourceMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      apiRequest("PATCH", `/api/reddit-sources/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reddit-sources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update source: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const deleteSourceMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/reddit-sources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reddit-sources"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Reddit source deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete source: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubreddit.trim()) return;
    
    const cleanSubreddit = newSubreddit.replace(/^r\//, "").trim();
    addSourceMutation.mutate(cleanSubreddit);
  };

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-black">Reddit Sources</h2>
            <p className="text-gray-600">Manage your content sources from Reddit</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 overflow-y-auto h-full">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Add New Source */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Reddit Source</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSource} className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Enter subreddit name (e.g., funny, AnimalsBeingDerps)"
                    value={newSubreddit}
                    onChange={(e) => setNewSubreddit(e.target.value)}
                    disabled={addSourceMutation.isPending}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="bg-success-green hover:bg-green-600"
                  disabled={addSourceMutation.isPending || !newSubreddit.trim()}
                >
                  <Plus size={16} className="mr-2" />
                  Add Source
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sources List */}
          <Card>
            <CardHeader>
              <CardTitle>Active Sources ({sources.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-blue mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading sources...</p>
                </div>
              ) : sources.length === 0 ? (
                <div className="text-center py-8">
                  <FaReddit className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No Reddit sources configured</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add a subreddit above to start collecting content
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sources.map((source: any) => (
                    <div 
                      key={source.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <FaReddit className="text-orange-500" size={24} />
                        <div>
                          <h3 className="font-medium text-text-black">
                            r/{source.subreddit}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Added {new Date(source.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
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
                        
                        <Switch
                          checked={source.isActive}
                          onCheckedChange={(checked) => 
                            toggleSourceMutation.mutate({ 
                              id: source.id, 
                              isActive: checked 
                            })
                          }
                          disabled={toggleSourceMutation.isPending}
                        />
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-error-red hover:bg-red-50"
                          onClick={() => deleteSourceMutation.mutate(source.id)}
                          disabled={deleteSourceMutation.isPending}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Subreddits */}
          <Card>
            <CardHeader>
              <CardTitle>Popular Subreddits for Funny Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[
                  "funny",
                  "AnimalsBeingDerps", 
                  "Unexpected",
                  "instant_regret",
                  "ContagiousLaughter",
                  "WhyWomenLiveLonger",
                  "therewasanattempt",
                  "facepalm"
                ].map((subreddit) => (
                  <Button
                    key={subreddit}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={() => setNewSubreddit(subreddit)}
                  >
                    <FaReddit className="mr-2" size={14} />
                    r/{subreddit}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
