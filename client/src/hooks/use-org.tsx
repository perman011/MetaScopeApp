import React, { createContext, useContext, useState, useEffect } from 'react';

interface SalesforceOrg {
  id: number;
  name: string;
  instanceUrl: string;
  orgId: string;
  edition: string;
  isSandbox: boolean;
}

interface OrgContextType {
  orgs: SalesforceOrg[];
  currentOrg: SalesforceOrg | null;
  isLoading: boolean;
  error: Error | null;
  selectOrg: (org: SalesforceOrg) => void;
  refreshOrgs: () => Promise<void>;
}

const defaultContext: OrgContextType = {
  orgs: [],
  currentOrg: null,
  isLoading: false,
  error: null,
  selectOrg: () => {},
  refreshOrgs: async () => {},
};

const OrgContext = createContext<OrgContextType>(defaultContext);

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [orgs, setOrgs] = useState<SalesforceOrg[]>([]);
  const [currentOrg, setCurrentOrg] = useState<SalesforceOrg | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchOrgs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/orgs');
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }
      const data = await response.json();
      setOrgs(data);
      
      // If we have orgs and no current org is selected, select the first one
      if (data.length > 0 && !currentOrg) {
        setCurrentOrg(data[0]);
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch orgs on component mount
    fetchOrgs();
  }, []);

  const selectOrg = (org: SalesforceOrg) => {
    setCurrentOrg(org);
    // You might want to store the selected org in localStorage or make an API call
    localStorage.setItem('selectedOrgId', org.id.toString());
  };

  const refreshOrgs = async () => {
    const orgsData = await fetchOrgs();
    
    // If we have a currentOrg, make sure it still exists in the refreshed list
    if (currentOrg) {
      const stillExists = orgsData.some(org => org.id === currentOrg.id);
      if (!stillExists && orgsData.length > 0) {
        setCurrentOrg(orgsData[0]);
      } else if (!stillExists) {
        setCurrentOrg(null);
      }
    }
  };

  const value = {
    orgs,
    currentOrg,
    isLoading,
    error,
    selectOrg,
    refreshOrgs,
  };

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (context === undefined) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
}