import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import Footer from "@/components/layout/footer";
import OrgContext from "@/components/org-context";
import FilterBar from "@/components/filter-bar";
import HealthScoreDashboard from "@/components/dashboard/health-score";
import DataModelAnalyzer from "@/components/dashboard/data-model-analyzer";
import SoqlEditor from "@/components/dashboard/soql-editor";
import SecurityAnalyzer from "@/components/dashboard/security-analyzer";
import ActionableInsights from "@/components/dashboard/actionable-insights";
import ConfigurationMoodRingCard from "@/components/configuration-mood-ring-card";
import { SalesforceOrg, HealthScore } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const [location, setLocation] = useLocation();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");

  const { data: orgs, isLoading } = useQuery<SalesforceOrg[]>({
    queryKey: ["/api/orgs"],
  });

  // Extract org ID from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const orgId = params.get("org");
    if (orgId) {
      setSelectedOrgId(parseInt(orgId));
    }
  }, [location]);

  // Set the first org as selected if none is selected and orgs are loaded
  useEffect(() => {
    if (!selectedOrgId && orgs && orgs.length > 0) {
      const activeOrg = orgs.find(org => org.isActive) || orgs[0];
      setSelectedOrgId(activeOrg.id);
    } else if (orgs && orgs.length === 0) {
      // Redirect to organizations page if no orgs are connected
      setLocation("/organizations?action=connect");
    }
  }, [orgs, selectedOrgId, setLocation]);

  const handleOrgChange = (orgId: number) => {
    setSelectedOrgId(orgId);
    setLocation(`/dashboard?org=${orgId}`);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type);
  };

  const handleProfileFilter = (profile: string) => {
    setProfileFilter(profile);
  };

  const { data: healthScore, isLoading: healthScoreLoading } = useQuery<HealthScore>({
    queryKey: [`/api/orgs/${selectedOrgId}/health-scores`],
    enabled: Boolean(selectedOrgId),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary-500 mb-4" />
              <p className="text-neutral-500">Loading organizations...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 lg:p-6">
          {selectedOrgId && (
            <>
              <OrgContext orgId={selectedOrgId} onOrgChange={handleOrgChange} />
              
              <FilterBar 
                onSearch={handleSearch}
                onTypeFilter={handleTypeFilter}
                onProfileFilter={handleProfileFilter}
              />
              
              <HealthScoreDashboard orgId={selectedOrgId} />
              
              {/* Configuration Mood Ring Card */}
              {healthScore && !healthScoreLoading && (
                <div className="mt-6">
                  <ConfigurationMoodRingCard healthScore={healthScore} />
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <DataModelAnalyzer orgId={selectedOrgId} />
                <SoqlEditor orgId={selectedOrgId} />
              </div>
              
              <div className="grid grid-cols-1 gap-6 mt-6">
                <SecurityAnalyzer orgId={selectedOrgId} />
              </div>
              
              <div className="mt-6 grid grid-cols-1 gap-6">
                <ActionableInsights orgId={selectedOrgId} />
              </div>
            </>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
