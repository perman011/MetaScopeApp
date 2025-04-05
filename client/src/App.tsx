import React from "react";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import Dashboard from "@/pages/dashboard";
import EnhancedDashboard from "@/pages/enhanced-dashboard";
import DataModelAnalyzer from "@/pages/data-model-analyzer";
import SOQLEditor from "@/pages/soql-editor";
import SecurityAnalyzer from "@/pages/security-analyzer";
import AutomationAnalyzer from "@/pages/automation-analyzer";
import UIComponentAnalyzer from "@/pages/ui-component-analyzer";
import MetadataDependencyAnalyzer from "@/pages/metadata-dependency-analyzer";
import PermissionsAnalyzer from "@/pages/permissions-analyzer";
import ApexDebugAnalyzer from "@/pages/apex-debug-analyzer";
import FieldIntelligence from "@/pages/field-intelligence";
import MetadataAnalytics from "@/pages/metadata-analytics";
import MetadataAnalyticsPanel from "@/pages/dashboard/MetadataAnalyticsPanel";
import FieldIntelligencePage from "@/pages/dashboard/FieldIntelligencePage";
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
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
      <div className="flex flex-col h-screen">
        <TopNavBar />
        <div className="flex flex-1 overflow-hidden">
          <SideNavigation />
          <main className="flex-1 overflow-y-auto bg-neutral-50">
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/enhanced-dashboard" component={EnhancedDashboard} />
              <Route path="/data-model-analyzer" component={DataModelAnalyzer} />
              <Route path="/soql-editor" component={SOQLEditor} />
              <Route path="/security-analyzer" component={SecurityAnalyzer} />
              <Route path="/automation-analyzer" component={AutomationAnalyzer} />
              <Route path="/ui-component-analyzer" component={UIComponentAnalyzer} />
              <Route path="/metadata-dependency-analyzer" component={MetadataDependencyAnalyzer} />
              <Route path="/permissions-analyzer" component={PermissionsAnalyzer} />
              <Route path="/apex-debug-analyzer" component={ApexDebugAnalyzer} />
              {/* Field Intelligence is now only accessible as a tab within Dashboard */}
              {/* <Route path="/field-intelligence" component={FieldIntelligence} /> */}
              <Route path="/metadata-analytics" component={MetadataAnalytics} />
              <Route path="/dashboard/org-health/metadata-components" component={() => 
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-6">Metadata Components Analytics</h1>
                  <p className="text-neutral-600 mb-6">
                    Comprehensive analysis of your Salesforce org's metadata components and their relationships.
                  </p>
                  <MetadataAnalyticsPanel />
                </div>
              } />
              <Route path="/dashboard/field-intelligence" component={FieldIntelligencePage} />
              <Route path="/settings" component={SettingsPage} />
              <Route path="/support" component={Support} />
              <Route path="/subscription" component={Subscription} />
              <Route path="/admin" component={AdminPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
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
