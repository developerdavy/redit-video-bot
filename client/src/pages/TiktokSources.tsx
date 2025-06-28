import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Hash, Play, Pause, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTiktokSourceSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import type { TiktokSource } from "@shared/schema";
import { z } from "zod";

const formSchema = insertTiktokSourceSchema.extend({
  hashtag: z.string().min(1, "Hashtag is required").regex(/^[a-zA-Z0-9_]+$/, "Hashtag can only contain letters, numbers, and underscores"),
});

type FormData = z.infer<typeof formSchema>;

export default function TiktokSources() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hashtag: "",
      isActive: true,
    },
  });

  const { data: sources = [], isLoading } = useQuery<TiktokSource[]>({
    queryKey: ["/api/tiktok-sources"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("POST", "/api/tiktok-sources", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tiktok-sources"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "TikTok hashtag source added successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/tiktok-sources/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tiktok-sources"] });
      toast({
        title: "Success",
        description: "TikTok source updated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/tiktok-sources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tiktok-sources"] });
      toast({
        title: "Success",
        description: "TikTok source deleted successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const fetchMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/tiktok-sources/${id}/fetch`) as Promise<{ fetched: number; total: number }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-items"] });
      toast({
        title: "Content Fetched",
        description: `Found ${data.fetched} new videos out of ${data.total} total videos`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">TikTok Sources</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">TikTok Sources</h1>
          <p className="text-muted-foreground">
            Manage hashtags to monitor for trending TikTok content
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Hashtag
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add TikTok Hashtag</DialogTitle>
              <DialogDescription>
                Enter a hashtag to monitor for trending videos
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="hashtag"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hashtag</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="fyp"
                            className="pl-10"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Enter hashtag without the # symbol
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active</FormLabel>
                        <FormDescription>
                          Automatically fetch content from this hashtag
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Adding..." : "Add Hashtag"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {sources.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Hash className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No TikTok hashtags added</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add hashtags to start monitoring trending TikTok content for your YouTube channel
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Hashtag
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sources.map((source: TiktokSource) => (
            <Card key={source.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <Hash className="mr-2 h-4 w-4" />
                    {source.hashtag}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={source.isActive}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({
                          id: source.id,
                          isActive: checked,
                        })
                      }
                      disabled={toggleMutation.isPending}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(source.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant={source.isActive ? "default" : "secondary"}>
                    {source.isActive ? (
                      <>
                        <Play className="mr-1 h-3 w-3" />
                        Active
                      </>
                    ) : (
                      <>
                        <Pause className="mr-1 h-3 w-3" />
                        Paused
                      </>
                    )}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchMutation.mutate(source.id)}
                    disabled={fetchMutation.isPending}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    {fetchMutation.isPending ? "Fetching..." : "Fetch Now"}
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  Added {new Date(source.createdAt).toLocaleDateString()}
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}