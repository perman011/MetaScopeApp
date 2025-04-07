import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchData } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Define Salesforce org type
export interface SalesforceOrg {
  id: number;
  name: string;
  instanceUrl: string;
  userId: number;
  environment: 'production' | 'sandbox';
  lastConnected?: string;
  tokenData?: any;
}

// Define org context state
interface OrgContextType {
  orgs: SalesforceOrg[];
  activeOrg: SalesforceOrg | null;
  currentOrg: SalesforceOrg | null;  // Alias for activeOrg for compatibility
  setActiveOrg: (org: SalesforceOrg | null) => void;
  loading: boolean;
  error: string | null;
  refreshOrgs: () => Promise<void>;
}

// Create the org context
const OrgContext = createContext<OrgContextType>({
  orgs: [],
  activeOrg: null,
  currentOrg: null,
  setActiveOrg: () => {},
  loading: false,
  error: null,
  refreshOrgs: async () => {},
});

// Provider component
export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [orgs, setOrgs] = useState<SalesforceOrg[]>([]);
  const [activeOrg, setActiveOrg] = useState<SalesforceOrg | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load orgs on initial mount
  const fetchOrgs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchData<SalesforceOrg[]>('/api/orgs');
      setOrgs(data);
      
      // Set active org from localStorage or use first org if available
      const savedOrgId = localStorage.getItem('activeOrgId');
      if (savedOrgId && data.length > 0) {
        const savedOrg = data.find(org => org.id === parseInt(savedOrgId));
        if (savedOrg) {
          setActiveOrg(savedOrg);
        } else {
          // If saved org no longer exists, use first available
          setActiveOrg(data[0]);
        }
      } else if (data.length > 0) {
        setActiveOrg(data[0]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load Salesforce orgs';
      setError(message);
      toast({
        title: 'Error loading orgs',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  // Save active org to localStorage when it changes
  useEffect(() => {
    if (activeOrg) {
      localStorage.setItem('activeOrgId', activeOrg.id.toString());
    }
  }, [activeOrg]);

  // Public method to refresh orgs list
  const refreshOrgs = async () => {
    await fetchOrgs();
  };

  return (
    <OrgContext.Provider
      value={{
        orgs,
        activeOrg,
        currentOrg: activeOrg, // Alias activeOrg as currentOrg for compatibility
        setActiveOrg,
        loading,
        error,
        refreshOrgs,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

// Custom hook for using org context
export function useOrg() {
  return useContext(OrgContext);
}