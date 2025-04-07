import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './use-auth';

export interface SalesforceOrg {
  id: number;
  name: string;
  instanceUrl: string;
  accessToken: string | null;
  refreshToken: string | null;
  userId: number;
  type?: string;
  domain?: string;
}

export interface OrgContextType {
  orgs: SalesforceOrg[];
  isLoading: boolean;
  error: string | null;
  selectedOrg: SalesforceOrg | null;
  setSelectedOrg: (org: SalesforceOrg | null) => void;
  fetchOrgs: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<SalesforceOrg[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<SalesforceOrg | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrgs = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/orgs');
      
      if (!response.ok) {
        throw new Error('Failed to fetch organizations');
      }
      
      const data = await response.json();
      setOrgs(data);
      
      // Set the first org as selected if there's no selection yet
      if (data.length > 0 && !selectedOrg) {
        setSelectedOrg(data[0]);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrgs();
    }
  }, [user]);

  const value = {
    orgs,
    isLoading,
    error,
    selectedOrg,
    setSelectedOrg,
    fetchOrgs
  };

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg() {
  const context = useContext(OrgContext);
  
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  
  return context;
}