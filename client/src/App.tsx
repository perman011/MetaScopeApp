import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import Dashboard from "@/pages/dashboard";
import DataModelAnalyzer from "@/pages/data-model-analyzer";
import SOQLEditor from "@/pages/soql-editor";
import SecurityAnalyzer from "@/pages/security-analyzer";
import { ProtectedRoute } from "./lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/data-model-analyzer" component={DataModelAnalyzer} />
      <ProtectedRoute path="/soql-editor" component={SOQLEditor} />
      <ProtectedRoute path="/security-analyzer" component={SecurityAnalyzer} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
