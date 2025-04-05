import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { HealthScore, HealthScoreIssue } from "@shared/schema";

interface CategoryScore {
  name: string;
  score: number;
  icon: React.ReactNode;
  description: string;
  path: string;
}

interface OrgHealthCardProps {
  healthScore: HealthScore | undefined;
  isLoading: boolean;
}

export default function OrgHealthCard({ healthScore, isLoading }: OrgHealthCardProps) {
  // Define the categories with their respective scores
  const categories: CategoryScore[] = healthScore ? [
    {
      name: "Security & Access",
      score: healthScore.securityScore,
      icon: <Shield className="h-5 w-5" />,
      description: "Review security configuration and access controls",
      path: "/security-analyzer",
    },
    {
      name: "Data Model",
      score: healthScore.dataModelScore,
      icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 18V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 18V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <rect x="4" y="6" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
        <rect x="4" y="14" width="16" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
      </svg>,
      description: "Analyze your data model structure and relationships",
      path: "/data-model-analyzer",
    },
    {
      name: "Automation Logic",
      score: healthScore.automationScore,
      icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 7L17 10L14 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 17L10 20L7 23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 10H10C8.34315 10 7 11.3431 7 13V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>,
      description: "Review workflows, processes, and automation logic",
      path: "/automation-analyzer",
    },
    {
      name: "Apex Code",
      score: healthScore.apexScore,
      icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 18L22 12L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 6L2 12L8 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 4L14 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>,
      description: "Analyze Apex code quality and performance",
      path: "/apex-debug-analyzer",
    },
    {
      name: "UI Components",
      score: healthScore.uiComponentScore,
      icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M3 9H21" stroke="currentColor" strokeWidth="2" />
        <path d="M9 9V21" stroke="currentColor" strokeWidth="2" />
      </svg>,
      description: "Evaluate UI components, pages, and Lightning components",
      path: "/ui-component-analyzer",
    },
  ] : [];

  // Helper function to determine score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 75) return "text-amber-600";
    return "text-red-600";
  };

  // Helper function to determine progress bar color
  const getProgressColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 75) return "bg-amber-500";
    return "bg-red-500";
  };

  // Count issues by severity if available
  const criticalIssues = healthScore?.issues ? 
    (healthScore.issues as HealthScoreIssue[]).filter(i => i.severity === 'critical').length : 0;
  const warningIssues = healthScore?.issues ? 
    (healthScore.issues as HealthScoreIssue[]).filter(i => i.severity === 'warning').length : 0;
  const totalIssues = healthScore?.issues ? 
    (healthScore.issues as HealthScoreIssue[]).length : 0;

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center justify-between">
          <span>Org Health Summary</span>
          {!isLoading && healthScore && (
            <span className={`text-2xl font-bold ${getScoreColor(healthScore.overallScore)}`}>
              {healthScore.overallScore}/100
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : healthScore ? (
          <>
            {/* Issues summary */}
            <div className="mb-4 p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="font-medium">Issues Found</div>
                  <div className="text-sm text-neutral-500">
                    {totalIssues === 0 ? (
                      "No issues detected"
                    ) : (
                      <>
                        {totalIssues} total: {criticalIssues} critical, {warningIssues} warnings
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Category scores */}
            <div className="space-y-3">
              {categories.map((category, index) => (
                <Link key={index} href={category.path}>
                  <div className="p-3 rounded-lg border border-neutral-200 hover:border-primary-300 cursor-pointer transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="text-neutral-600">
                          {category.icon}
                        </div>
                        <div className="font-medium">{category.name}</div>
                      </div>
                      <div className={getScoreColor(category.score)}>
                        {category.score}/100
                      </div>
                    </div>
                    <div className="h-2 bg-neutral-200 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full ${getProgressColor(category.score)} transition-all duration-500`}
                        style={{ width: `${category.score}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-neutral-500">
                        {category.description}
                      </div>
                      <ArrowRight className="h-4 w-4 text-neutral-400" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-neutral-500">
            <p>No health score data available.</p>
            <p className="text-sm">Connect a Salesforce org to view health analytics.</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/org-health/metadata-components">
            View Metadata Components
          </Link>
        </Button>
        <Button size="sm" disabled={isLoading || !healthScore} asChild>
          <Link href="#view-all-issues">
            View All Issues
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}