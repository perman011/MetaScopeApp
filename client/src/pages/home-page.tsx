import { useLocation } from "wouter";
import SalesforceOrgManager from "@/components/salesforce-org-manager";
import { useOrg } from "@/hooks/use-org";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  
  // Try to use org context only if we're sure we're authenticated
  const orgContext = (() => {
    try {
      return useOrg();
    } catch (e) {
      return { activeOrg: null };
    }
  })();
  
  const { activeOrg } = orgContext;
  
  // We'll no longer auto-redirect to dashboard, allowing user to see and access all pages
  /*
  useEffect(() => {
    if (activeOrg) {
      navigate("/dashboard");
    }
  }, [activeOrg, navigate]);
  */

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-primary-600 mb-4">Welcome to MetaScope</h1>
          <p className="text-xl text-neutral-500 mb-8">Connect to a Salesforce org to get started</p>
          
          <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg overflow-hidden border border-neutral-200">
            <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
              <h2 className="text-lg font-medium text-neutral-800">Connect your Salesforce org</h2>
              <p className="mt-1 text-sm text-neutral-500">Select an existing org or add a new one to begin</p>
            </div>
            <div className="p-6">
              <SalesforceOrgManager />
            </div>
          </div>
          
          <div className="mt-8 grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              <div className="p-6">
                <div className="aspect-w-16 aspect-h-9 bg-neutral-100 rounded-lg mb-4 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-800 mb-2">Visualize Data Models</h3>
                <p className="text-neutral-500 text-sm mb-4">
                  Explore object relationships and field dependencies with interactive visualizations
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              <div className="p-6">
                <div className="aspect-w-16 aspect-h-9 bg-neutral-100 rounded-lg mb-4 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-800 mb-2">Query with Confidence</h3>
                <p className="text-neutral-500 text-sm mb-4">
                  Write, optimize, and execute SOQL/SOSL queries with real-time suggestions
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              <div className="p-6">
                <div className="aspect-w-16 aspect-h-9 bg-neutral-100 rounded-lg mb-4 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1 1-1-.257-.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-800 mb-2">Ensure Security</h3>
                <p className="text-neutral-500 text-sm mb-4">
                  Analyze security configurations and identify potential vulnerabilities
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
