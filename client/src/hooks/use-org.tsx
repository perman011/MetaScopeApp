import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { SalesforceOrg } from "@shared/schema";

interface OrgContextType {
  activeOrg: SalesforceOrg | null;
  setActiveOrg: (org: SalesforceOrg | null) => void;
  isLoading: boolean;
}

const OrgContext = createContext<OrgContextType | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [activeOrg, setActiveOrg] = useState<SalesforceOrg | null>(null);
  
  // Fetch orgs
  const { data: orgs, isLoading } = useQuery<SalesforceOrg[]>({
    queryKey: ["/api/orgs"],
    enabled: true,
    onSuccess: (data: SalesforceOrg[]) => {
      console.log("Orgs fetched successfully:", data);
    },
    onError: (error: Error) => {
      console.error("Error fetching orgs:", error);
    }
  });
  
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
