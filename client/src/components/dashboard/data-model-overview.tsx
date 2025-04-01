import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

interface DataModelOverviewProps {
  metadata: any;
  isLoading: boolean;
}

export default function DataModelOverview({ metadata, isLoading }: DataModelOverviewProps) {
  const [, navigate] = useLocation();
  
  // Extract object metadata from all metadata
  const objectMetadata = metadata?.find(m => m.type === 'CustomObject')?.data;
  
  // Get object count and other statistics
  const objectCount = objectMetadata?.objects?.length || 0;
  const fieldCount = objectMetadata?.objects?.reduce((acc, obj) => acc + (obj.fields?.length || 0), 0) || 0;
  
  // Static statistics for other metadata types (would be dynamic in a full implementation)
  const apexClassCount = 156;
  const flowsCount = 83;
  const componentsCount = 64;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-neutral-800">Data Model Overview</h3>
            <button 
              onClick={() => navigate("/data-model-analyzer")} 
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Open analyzer
            </button>
          </div>
        </div>
        
        <div className="px-4 py-5 sm:p-6 h-96 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Skeleton className="h-full w-full max-w-3xl rounded-lg" />
            </div>
          ) : !objectMetadata ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-neutral-500">No data model available</p>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg border border-neutral-200 shadow-sm w-full max-w-3xl">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium">Object Relationship Map</h4>
                  <div className="flex space-x-2">
                    <button className="p-1 rounded-md hover:bg-neutral-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button className="p-1 rounded-md hover:bg-neutral-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button className="p-1 rounded-md hover:bg-neutral-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button className="p-1 rounded-md hover:bg-neutral-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="border-2 border-neutral-200 border-dashed rounded-lg h-64 flex items-center justify-center">
                  <svg width="100%" height="100%" viewBox="0 0 500 240" xmlns="http://www.w3.org/2000/svg">
                    {/* Account Node */}
                    <circle cx="250" cy="120" r="30" fill="#0061D5" opacity="0.9" />
                    <text x="250" y="120" textAnchor="middle" dominantBaseline="middle" fill="white" fontWeight="bold">Account</text>
                    
                    {/* Contact Node */}
                    <circle cx="150" cy="70" r="25" fill="#6C63FF" opacity="0.9" />
                    <text x="150" y="70" textAnchor="middle" dominantBaseline="middle" fill="white" fontWeight="bold">Contact</text>
                    
                    {/* Opportunity Node */}
                    <circle cx="350" cy="70" r="25" fill="#6C63FF" opacity="0.9" />
                    <text x="350" y="70" textAnchor="middle" dominantBaseline="middle" fill="white" fontWeight="bold">Opportunity</text>
                    
                    {/* Case Node */}
                    <circle cx="150" cy="170" r="25" fill="#6C63FF" opacity="0.9" />
                    <text x="150" y="170" textAnchor="middle" dominantBaseline="middle" fill="white" fontWeight="bold">Case</text>
                    
                    {/* Product Node */}
                    <circle cx="350" cy="170" r="25" fill="#6C63FF" opacity="0.9" />
                    <text x="350" y="170" textAnchor="middle" dominantBaseline="middle" fill="white" fontWeight="bold">Product</text>
                    
                    {/* Connecting Lines */}
                    <line x1="250" y1="120" x2="150" y2="70" stroke="#718096" strokeWidth="2" />
                    <line x1="250" y1="120" x2="350" y2="70" stroke="#718096" strokeWidth="2" />
                    <line x1="250" y1="120" x2="150" y2="170" stroke="#718096" strokeWidth="2" />
                    <line x1="350" y1="70" x2="350" y2="170" stroke="#718096" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
          <h3 className="text-lg font-medium text-neutral-800">Metadata Statistics</h3>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className="text-sm font-medium text-neutral-500">Custom Objects</dt>
              <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                <div className="flex items-baseline text-2xl font-semibold text-neutral-800">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <>
                      {objectCount}
                      <span className="ml-2 text-sm font-medium text-neutral-500">of 2,000 limit</span>
                    </>
                  )}
                </div>
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-neutral-500">Custom Fields</dt>
              <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                <div className="flex items-baseline text-2xl font-semibold text-neutral-800">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    fieldCount
                  )}
                </div>
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-neutral-500">Apex Classes</dt>
              <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                <div className="flex items-baseline text-2xl font-semibold text-neutral-800">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    apexClassCount
                  )}
                </div>
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-neutral-500">Flows & Processes</dt>
              <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                <div className="flex items-baseline text-2xl font-semibold text-neutral-800">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    flowsCount
                  )}
                </div>
              </dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-neutral-500">Lightning Components</dt>
              <dd className="mt-1 flex items-baseline justify-between md:block lg:flex">
                <div className="flex items-baseline text-2xl font-semibold text-neutral-800">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    componentsCount
                  )}
                </div>
              </dd>
            </div>
          </dl>
        </div>
        
        <CardFooter className="bg-neutral-50 px-4 py-4 sm:px-6 border-t border-neutral-200">
          <button
            onClick={() => navigate("/data-model-analyzer")}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View all metadata types
          </button>
        </CardFooter>
      </div>
    </div>
  );
}
