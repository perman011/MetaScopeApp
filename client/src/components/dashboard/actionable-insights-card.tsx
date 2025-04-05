import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthScoreIssue } from "@shared/schema";
import IssueDetailsCard from "./issue-details-card";

interface ActionableInsightsCardProps {
  issues: HealthScoreIssue[] | undefined;
  isLoading: boolean;
  onAutoFix?: (issueId: string) => void;
}

// Map of issue IDs that can be automatically fixed
const AUTO_FIXABLE_ISSUES = new Set([
  "SEC-003", // Excessive Profile Permissions
  "SEC-004", // Sharing Rule Gaps
  "COMP-001", // Complex Apex with missing comments
  "AUTO-002", // Redundant workflow rules
]);

export default function ActionableInsightsCard({ issues, isLoading, onAutoFix }: ActionableInsightsCardProps) {
  // Display top 3 critical issues first, then warnings if fewer than 3 critical issues
  const prioritizedIssues = React.useMemo(() => {
    if (!issues) return [];
    
    const critical = issues.filter(i => i.severity === 'critical');
    const warnings = issues.filter(i => i.severity === 'warning');
    
    if (critical.length >= 3) {
      return critical.slice(0, 3);
    }
    
    return [...critical, ...warnings].slice(0, 3);
  }, [issues]);
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Actionable Insights</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : prioritizedIssues.length > 0 ? (
          <div className="space-y-4">
            {prioritizedIssues.map((issue) => (
              <IssueDetailsCard 
                key={issue.id} 
                issue={issue}
                isFixable={AUTO_FIXABLE_ISSUES.has(issue.id)}
                onAutoFix={onAutoFix}
              />
            ))}
            
            {issues && issues.length > 3 && (
              <div className="text-center mt-4">
                <Button variant="outline">
                  View All {issues.length} Issues
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500">
            <p>No issues found.</p>
            <p className="text-sm">Your Salesforce org is in good health!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}