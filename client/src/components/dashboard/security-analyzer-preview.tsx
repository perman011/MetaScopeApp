import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { AlertTriangle } from "lucide-react";
import { HealthScoreIssue } from "@shared/schema";

interface SecurityAnalyzerPreviewProps {
  issues?: HealthScoreIssue[];
  isLoading: boolean;
}

export default function SecurityAnalyzerPreview({ issues, isLoading }: SecurityAnalyzerPreviewProps) {
  const [, navigate] = useLocation();
  
  // Filter security issues
  const securityIssues = issues?.filter(issue => issue.category === 'security') || [];
  
  // Count critical and warning issues
  const criticalCount = securityIssues.filter(issue => issue.severity === 'critical').length;
  const warningCount = securityIssues.filter(issue => issue.severity === 'warning').length;

  return (
    <Card className="bg-white rounded-lg shadow-sm overflow-hidden">
      <CardHeader className="px-4 py-5 sm:px-6 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-neutral-800">Security Issues</CardTitle>
          <button
            onClick={() => navigate("/security-analyzer")}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Open security analyzer
          </button>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 py-5 sm:p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : securityIssues.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-neutral-500">No security issues detected</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {securityIssues.slice(0, 4).map((issue) => (
              <div key={issue.id} className={`${securityIssues.indexOf(issue) === 0 ? "" : "pt-4"} ${securityIssues.indexOf(issue) === securityIssues.length - 1 ? "pb-0" : "pb-4"}`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertTriangle className={`h-5 w-5 ${issue.severity === 'critical' ? 'text-danger' : 'text-warning'}`} />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-neutral-800">{issue.title}</h3>
                    <div className="mt-1 text-sm text-neutral-500">
                      <p>{issue.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="bg-neutral-50 px-4 py-4 sm:px-6 border-t border-neutral-200">
        <span className="text-sm text-neutral-500">
          {isLoading ? (
            <Skeleton className="h-5 w-48" />
          ) : (
            `${criticalCount} critical, ${warningCount} warning issues found`
          )}
        </span>
      </CardFooter>
    </Card>
  );
}
