import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import RedditSources from "@/pages/RedditSources";
import AIGenerator from "@/pages/AIGenerator";
import PreviewQueue from "@/pages/PreviewQueue";
import ScheduledPosts from "@/pages/ScheduledPosts";
import Analytics from "@/pages/Analytics";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/reddit-sources" component={RedditSources} />
        <Route path="/ai-generator" component={AIGenerator} />
        <Route path="/preview-queue" component={PreviewQueue} />
        <Route path="/scheduled-posts" component={ScheduledPosts} />
        <Route path="/analytics" component={Analytics} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
