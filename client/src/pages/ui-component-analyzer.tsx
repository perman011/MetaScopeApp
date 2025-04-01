import TopNavBar from "@/components/layout/top-nav-bar";
import SideNavigation from "@/components/layout/side-navigation";
import { FileCode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useOrgContext } from "@/hooks/use-org";
import { useState } from "react";

export default function UIComponentAnalyzer() {
  const { activeOrg } = useOrgContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Simulates analysis process
  const startAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };
  
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <TopNavBar />
      <div className="flex flex-1 overflow-hidden">
        <SideNavigation />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-neutral-800">UI Component Analyzer</h1>
                <p className="text-neutral-600">
                  Analyze Lightning components, Aura bundles, and Visualforce pages across your org.
                </p>
              </div>
              <div>
                <Button
                  onClick={startAnalysis}
                  disabled={isAnalyzing || !activeOrg}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <FileCode className="mr-2 h-4 w-4" />
                      Run Analysis
                    </>
                  )}
                </Button>
              </div>
            </div>

            {!activeOrg && (
              <Alert className="mb-6">
                <AlertTitle>No org selected</AlertTitle>
                <AlertDescription>
                  Please select a Salesforce org to analyze UI components.
                </AlertDescription>
              </Alert>
            )}

            <Card className="text-center p-6">
              <div className="mb-4">
                <FileCode className="h-12 w-12 mx-auto text-primary-500" />
              </div>
              <h2 className="text-xl font-medium text-neutral-800 mb-2">Coming Soon</h2>
              <p className="text-neutral-600 max-w-md mx-auto mb-4">
                The UI Component Analyzer is currently under development. This feature 
                will help you analyze Lightning components, Aura bundles, and Visualforce 
                pages for best practices and performance optimization.
              </p>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}