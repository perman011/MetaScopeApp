import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckBadgeIcon, ExclamationTriangleIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { formatDistanceToNow } from "date-fns";

interface HealthScoreOverviewProps {
  healthScore: any;
  isLoading: boolean;
}

export default function HealthScoreOverview({ healthScore, isLoading }: HealthScoreOverviewProps) {
  // Calculate critical and warning issues count
  const criticalIssues = healthScore?.issues?.filter((i: { severity: string }) => i.severity === 'critical').length || 0;
  const warningIssues = healthScore?.issues?.filter((i: { severity: string }) => i.severity === 'warning').length || 0;

  // Format last analyzed time
  const lastAnalyzed = healthScore?.lastAnalyzed
    ? formatDistanceToNow(new Date(healthScore.lastAnalyzed), { addSuffix: true })
    : 'Never';

  return (
    <Card className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-neutral-200">
        <CardTitle className="text-lg font-medium text-neutral-800">Org Health Score</CardTitle>
        <p className="mt-1 text-sm text-neutral-500">Overall health evaluation of your Salesforce org</p>
      </CardHeader>
      
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overall Health */}
          <div className="bg-neutral-50 rounded-lg p-5 border border-neutral-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 bg-success bg-opacity-10 rounded-full flex items-center justify-center">
                <CheckBadgeIcon className="h-6 w-6 text-success" />
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-medium text-neutral-800">Overall Health</h4>
                <div className="mt-1 flex items-baseline">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : healthScore ? (
                    <>
                      <p className="text-2xl font-semibold text-success">
                        {healthScore.overallScore}/100
                      </p>
                      <p className="ml-2 text-sm text-neutral-500">
                        +3 since last check
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-neutral-500">Not available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Issues Found */}
          <div className="bg-neutral-50 rounded-lg p-5 border border-neutral-200">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 bg-warning bg-opacity-10 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-warning" />
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-medium text-neutral-800">Issues Found</h4>
                <div className="mt-1 flex items-baseline">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : healthScore?.issues ? (
                    <>
                      <p className="text-2xl font-semibold text-warning">
                        {healthScore.issues.length}
                      </p>
                      <p className="ml-2 text-sm text-neutral-500">
                        {warningIssues} warnings, {criticalIssues} critical
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-neutral-500">Not available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Metadata Components */}
          <div className="bg-neutral-50 rounded-lg p-5 border border-neutral-200 cursor-pointer hover:border-primary-300 transition-colors" 
               onClick={() => window.location.href = '/dashboard/org-health/metadata-components'}>
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 bg-secondary-500 bg-opacity-10 rounded-full flex items-center justify-center">
                <Squares2X2Icon className="h-6 w-6 text-secondary-500" />
              </div>
              <div className="ml-4">
                <h4 className="text-lg font-medium text-neutral-800">Metadata Components</h4>
                <div className="mt-1 flex items-baseline">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <p className="text-2xl font-semibold text-secondary-500">
                        {healthScore?.metadataVolume || 432}
                      </p>
                      <p className="ml-2 text-sm text-neutral-500">
                        Click to view analytics
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Score Breakdown */}
        <div className="mt-6">
          <h4 className="text-base font-medium text-neutral-800 mb-3">Score Breakdown</h4>
          <div className="space-y-3">
            {isLoading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : healthScore ? (
              <>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="font-medium">Security & Access</div>
                    <div className={healthScore.securityScore >= 90 ? 'text-green-600' : healthScore.securityScore >= 70 ? 'text-amber-600' : 'text-red-600'}>
                      {healthScore.securityScore}/100
                    </div>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className={healthScore.securityScore >= 90 ? 'bg-green-500' : healthScore.securityScore >= 70 ? 'bg-amber-500' : 'bg-red-500'} 
                      style={{ width: `${healthScore.securityScore}%` }}
                      data-testid="security-score-bar"
                      key={`security-score-${healthScore.securityScore}`}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="font-medium">Data Model</div>
                    <div className={healthScore.dataModelScore >= 90 ? 'text-green-600' : healthScore.dataModelScore >= 70 ? 'text-amber-600' : 'text-red-600'}>
                      {healthScore.dataModelScore}/100
                    </div>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className={healthScore.dataModelScore >= 90 ? 'bg-green-500' : healthScore.dataModelScore >= 70 ? 'bg-amber-500' : 'bg-red-500'}
                      style={{ width: `${healthScore.dataModelScore}%` }}
                      data-testid="data-model-score-bar"
                      key={`data-model-score-${healthScore.dataModelScore}`}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="font-medium">Automation Logic</div>
                    <div className={healthScore.automationScore >= 90 ? 'text-green-600' : healthScore.automationScore >= 70 ? 'text-amber-600' : 'text-red-600'}>
                      {healthScore.automationScore}/100
                    </div>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className={healthScore.automationScore >= 90 ? 'bg-green-500' : healthScore.automationScore >= 70 ? 'bg-amber-500' : 'bg-red-500'} 
                      style={{ width: `${healthScore.automationScore}%` }}
                      data-testid="automation-score-bar"
                      key={`automation-score-${healthScore.automationScore}`}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="font-medium">Apex Code</div>
                    <div className={healthScore.apexScore >= 90 ? 'text-green-600' : healthScore.apexScore >= 70 ? 'text-amber-600' : 'text-red-600'}>
                      {healthScore.apexScore}/100
                    </div>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className={healthScore.apexScore >= 90 ? 'bg-green-500' : healthScore.apexScore >= 70 ? 'bg-amber-500' : 'bg-red-500'} 
                      style={{ width: `${healthScore.apexScore}%`, transition: 'width 0.5s ease-in-out' }}
                      data-testid="apex-score-bar"
                      key={`apex-score-${healthScore.apexScore}`}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="font-medium">UI Components</div>
                    <div className={healthScore.uiComponentScore >= 90 ? 'text-green-600' : healthScore.uiComponentScore >= 70 ? 'text-amber-600' : 'text-red-600'}>
                      {healthScore.uiComponentScore}/100
                    </div>
                  </div>
                  <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div 
                      className={healthScore.uiComponentScore >= 90 ? 'bg-green-500' : healthScore.uiComponentScore >= 70 ? 'bg-amber-500' : 'bg-red-500'} 
                      style={{ width: `${healthScore.uiComponentScore}%`, transition: 'width 0.5s ease-in-out' }}
                      data-testid="ui-score-bar"
                      key={`ui-score-${healthScore.uiComponentScore}`}
                    ></div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-neutral-500">No health score data available</p>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-neutral-50 px-4 py-4 sm:px-6 border-t border-neutral-200">
        <div className="flex items-center justify-between flex-wrap sm:flex-nowrap w-full">
          <div className="text-sm font-medium text-primary-600">
            <a href="#" className="hover:text-primary-700 mr-4">View detailed health report</a>
            <a href="/dashboard/org-health/metadata-components" className="hover:text-primary-700">View Metadata Analytics</a>
          </div>
          <div className="text-sm text-neutral-500">
            Last analyzed: {lastAnalyzed}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
