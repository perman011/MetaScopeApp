import { Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  Home,
  Database,
  Code,
  Shield,
  Workflow,
  Layout,
  PackageOpen,
  Plus,
  CircleDot 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SalesforceOrg } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Sidebar() {
  const [location] = useLocation();
  const { data: orgs, isLoading } = useQuery<SalesforceOrg[]>({
    queryKey: ["/api/orgs"],
  });

  return (
    <aside className="w-16 md:w-56 bg-white border-r border-neutral-200 flex flex-col">
      <div className="py-4 px-2 md:px-4 flex-1 overflow-y-auto">
        <div className="mb-6">
          <h3 className="hidden md:block px-2 text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
            Analyzers
          </h3>
          <ul className="space-y-1">
            <li>
              <Link href="/dashboard">
                <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location === "/dashboard" 
                    ? "bg-primary-50 text-primary-600" 
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}>
                  <Home className="h-5 w-5 md:mr-3" />
                  <span className="hidden md:inline">Dashboard</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/data-model">
                <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location === "/data-model" 
                    ? "bg-primary-50 text-primary-600" 
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}>
                  <Database className="h-5 w-5 md:mr-3" />
                  <span className="hidden md:inline">Data Model</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/soql">
                <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location === "/soql" 
                    ? "bg-primary-50 text-primary-600" 
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}>
                  <Code className="h-5 w-5 md:mr-3" />
                  <span className="hidden md:inline">SOQL/SOSL Editor</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/security">
                <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location === "/security" 
                    ? "bg-primary-50 text-primary-600" 
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}>
                  <Shield className="h-5 w-5 md:mr-3" />
                  <span className="hidden md:inline">Security Analyzer</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/automation">
                <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location === "/automation" 
                    ? "bg-primary-50 text-primary-600" 
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}>
                  <Workflow className="h-5 w-5 md:mr-3" />
                  <span className="hidden md:inline">Automation</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/ui-components">
                <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location === "/ui-components" 
                    ? "bg-primary-50 text-primary-600" 
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}>
                  <Layout className="h-5 w-5 md:mr-3" />
                  <span className="hidden md:inline">UI Components</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/apex-debug">
                <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  location === "/apex-debug" 
                    ? "bg-primary-50 text-primary-600" 
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}>
                  <PackageOpen className="h-5 w-5 md:mr-3" />
                  <span className="hidden md:inline">Apex Debug</span>
                </a>
              </Link>
            </li>
          </ul>
        </div>
        
        <div>
          <h3 className="hidden md:block px-2 text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
            Connected Orgs
          </h3>
          <ul className="space-y-1">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <li key={i}>
                  <div className="flex items-center px-2 py-2">
                    <Skeleton className="h-2 w-2 rounded-full mr-2" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </li>
              ))
            ) : orgs && orgs.length > 0 ? (
              orgs.map((org) => (
                <li key={org.id}>
                  <Link href={`/dashboard?org=${org.id}`}>
                    <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      location === `/dashboard?org=${org.id}` || 
                      (!location.includes('?org=') && org.isActive)
                        ? "bg-neutral-100 text-neutral-900"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        org.name.toLowerCase().includes('production') 
                          ? 'bg-emerald-500' 
                          : org.name.toLowerCase().includes('sandbox') 
                            ? 'bg-amber-500' 
                            : 'bg-neutral-400'
                      }`} />
                      <span className="hidden md:inline truncate max-w-[160px]">{org.name}</span>
                    </a>
                  </Link>
                </li>
              ))
            ) : (
              <li>
                <div className="px-2 py-2 text-sm text-neutral-500 hidden md:block">
                  No orgs connected
                </div>
              </li>
            )}
            <li>
              <Link href="/organizations?action=connect">
                <a className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-primary-500 hover:bg-primary-50">
                  <Plus className="h-5 w-5 md:mr-2" />
                  <span className="hidden md:inline">Connect New Org</span>
                </a>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
