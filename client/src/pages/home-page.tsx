import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SalesforceOrg } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const [, navigate] = useLocation();
  const { data: orgs, isLoading } = useQuery<SalesforceOrg[]>({
    queryKey: ["/api/orgs"],
  });

  // Redirect to dashboard if orgs exist, or to organizations page if no orgs
  useEffect(() => {
    if (!isLoading) {
      if (orgs && orgs.length > 0) {
        navigate("/dashboard");
      } else {
        navigate("/organizations?action=connect");
      }
    }
  }, [orgs, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary-500 mb-4" />
        <p className="text-neutral-500">Loading your Salesforce Metadata Analyzer...</p>
      </div>
    </div>
  );
}
