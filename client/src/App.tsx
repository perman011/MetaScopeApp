import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import Dashboard from "@/pages/dashboard";
import DataModelAnalyzer from "@/pages/data-model-analyzer";
import SOQLEditor from "@/pages/soql-editor";
import SecurityAnalyzer from "@/pages/security-analyzer";
import AutomationAnalyzer from "@/pages/automation-analyzer";
import UIComponentAnalyzer from "@/pages/ui-component-analyzer";
import SettingsPage from "@/pages/settings-page";
import Support from "@/pages/support";
import Subscription from "@/pages/subscription";
import AdminPage from "@/pages/admin-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { OrgProvider } from "./hooks/use-org";
import { useAuth } from "@/hooks/use-auth";
import TopNavBar from "@/components/layout/top-nav-bar";
import SideNavigation from "@/components/layout/side-navigation";

// This wrapper ensures OrgProvider is only used when user is authenticated
function AuthenticatedRoutes() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return null; // Show nothing while loading
  }
  
  if (!user) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route>
          <Route path="*" component={() => <Route path="*"><AuthPage /></Route>} />
        </Route>
      </Switch>
    );
  }
  
  // User is authenticated, wrap protected routes with OrgProvider
  return (
    <OrgProvider>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/data-model-analyzer" component={DataModelAnalyzer} />
        <Route path="/soql-editor" component={SOQLEditor} />
        <Route path="/security-analyzer" component={SecurityAnalyzer} />
        <Route path="/automation-analyzer" component={AutomationAnalyzer} />
        <Route path="/ui-component-analyzer" component={UIComponentAnalyzer} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/support" component={Support} />
        <Route path="/subscription" component={Subscription} />
        <Route path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
    </OrgProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="*">
          <AuthenticatedRoutes />
        </Route>
      </Switch>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
