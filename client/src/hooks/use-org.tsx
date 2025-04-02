import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SalesforceOrg } from "@shared/schema";

interface OrgContextType {
  activeOrg: SalesforceOrg | null;
  setActiveOrg: (org: SalesforceOrg | null) => void;
  isLoading: boolean;
  refetchOrgs: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [activeOrg, setActiveOrg] = useState<SalesforceOrg | null>(null);
  const queryClient = useQueryClient();
  
  // Fetch orgs
  const { data: orgs, isLoading, refetch } = useQuery<SalesforceOrg[]>({
    queryKey: ["/api/orgs"],
    enabled: true,
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchOnWindowFocus: true,
    onSuccess: (data: SalesforceOrg[]) => {
      console.log("Orgs fetched successfully:", data);
    },
    onError: (error: Error) => {
      console.error("Error fetching orgs:", error);
    }
  });
  
  // Function to manually refetch orgs
  const refetchOrgs = async () => {
    console.log("Manually refetching orgs...");
    await queryClient.invalidateQueries({ queryKey: ["/api/orgs"] });
    const result = await refetch();
    console.log("Refetch result:", result.data);
  };
  
  // Set the first org as active if none is selected and orgs are loaded
  useEffect(() => {
    console.log("Org context effect triggered - orgs:", orgs, "activeOrg:", activeOrg);
    if (!activeOrg && orgs && orgs.length > 0) {
      console.log("Setting first org as active:", orgs[0]);
      setActiveOrg(orgs[0]);
    }
  }, [orgs, activeOrg]);
  
  // Store active org in local storage
  useEffect(() => {
    if (activeOrg) {
      localStorage.setItem("activeOrgId", activeOrg.id.toString());
    }
  }, [activeOrg]);
  
  // Retrieve active org from local storage on initial load
  useEffect(() => {
    const storedOrgId = localStorage.getItem("activeOrgId");
    if (storedOrgId && orgs) {
      const org = orgs.find((o: SalesforceOrg) => o.id.toString() === storedOrgId);
      if (org) {
        setActiveOrg(org);
      }
    }
  }, [orgs]);
  
  return (
    <OrgContext.Provider
      value={{
        activeOrg,
        setActiveOrg,
        isLoading,
        refetchOrgs,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrgContext() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrgContext must be used within an OrgProvider");
  }
  return context;
}
