import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrgContext } from "@/hooks/use-org";
import { apiRequest } from "@/lib/queryClient";
import FieldIntelligence from "@/components/dashboard/field-intelligence";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FieldIntelligencePage() {
  const { activeOrg } = useOrgContext();

  // Fetch metadata for active org to ensure it's available
  const { data: metadata, isLoading: isMetadataLoading } = useQuery({
    queryKey: [`/api/orgs/${activeOrg?.id}/metadata`],
    enabled: !!activeOrg,
  });

  // Sync metadata if none exists
  useEffect(() => {
    if (activeOrg && !isMetadataLoading && (!metadata || !Array.isArray(metadata) || metadata.length === 0)) {
      const syncMetadata = async () => {
        try {
          await apiRequest("POST", `/api/orgs/${activeOrg.id}/sync`, {});
        } catch (error) {
          console.error("Error syncing metadata:", error);
        }
      };
      syncMetadata();
    }
  }, [activeOrg, metadata, isMetadataLoading]);

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-neutral-800">Field Intelligence</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Identify underused, poorly named, or undocumented fields to improve your Salesforce data model
          </p>
        </div>
        
        {!activeOrg ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No Salesforce Org Connected</h3>
              <p className="text-sm text-neutral-500 mb-4">
                Connect a Salesforce org to view field intelligence analytics.
              </p>
              <Button>Connect Salesforce Org</Button>
            </CardContent>
          </Card>
        ) : (
          <FieldIntelligence orgId={activeOrg.id} />
        )}
      </div>
    </div>
  );
}