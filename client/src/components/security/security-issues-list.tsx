import { Card } from "@/components/ui/card";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HealthScoreIssue } from "@shared/schema";

interface SecurityIssuesListProps {
  issues: HealthScoreIssue[];
}

export default function SecurityIssuesList({ issues }: SecurityIssuesListProps) {
  return (
    <div className="divide-y divide-neutral-200">
      {issues.map((issue) => (
        <div key={issue.id} className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              {issue.severity === 'critical' ? (
                <AlertCircle className="h-5 w-5 text-danger" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-warning" />
              )}
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-neutral-800">{issue.title}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  issue.severity === 'critical' 
                    ? 'bg-danger bg-opacity-10 text-danger' 
                    : 'bg-warning bg-opacity-10 text-warning'
                }`}>
                  {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                </span>
              </div>
              
              <div className="mt-2 text-sm text-neutral-500">
                <p>{issue.description}</p>
              </div>
              
              <div className="mt-3 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-neutral-700">Impact</h4>
                  <p className="mt-1 text-sm text-neutral-500">{issue.impact}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-neutral-700">Recommendation</h4>
                  <p className="mt-1 text-sm text-neutral-500">{issue.recommendation}</p>
                </div>
              </div>
              
              <div className="mt-4 flex">
                <Button variant="outline" size="sm" className="mr-2">
                  Ignore
                </Button>
                <Button size="sm">
                  Fix Issue
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {issues.length === 0 && (
        <div className="p-6 text-center">
          <p className="text-neutral-500">No security issues found.</p>
        </div>
      )}
    </div>
  );
}
