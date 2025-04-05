import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { HealthScore, HealthScoreIssue } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface SimplifiedOrgHealthProps {
  healthScore: HealthScore | undefined;
  isLoading: boolean;
  onIssueClick?: (issueId: string) => void;
}

export default function SimplifiedOrgHealth({ 
  healthScore, 
  isLoading,
  onIssueClick
}: SimplifiedOrgHealthProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  
  const toggleCategory = (categoryName: string) => {
    if (expandedCategory === categoryName) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryName);
    }
  };
  
  // If no health score is available, return a placeholder
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }
  
  if (!healthScore) {
    return (
      <Card className="text-center p-6">
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-2">No Health Score Available</h3>
          <p className="text-neutral-500 mb-4">
            Connect a Salesforce org to view health analytics.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Map healthScore data to categories
  const categories = [
    { name: 'Security & Access', score: healthScore.securityScore, maxScore: 100 },
    { name: 'Data Model', score: healthScore.dataModelScore, maxScore: 100 },
    { name: 'Automation Logic', score: healthScore.automationScore, maxScore: 100 },
    { name: 'Apex Code', score: healthScore.apexScore, maxScore: 100 },
    { name: 'UI Components', score: healthScore.uiComponentScore, maxScore: 100 }
  ];
  
  // Group issues by category
  const issuesByCategory: Record<string, HealthScoreIssue[]> = {
    'Security & Access': [],
    'Data Model': [],
    'Automation Logic': [],
    'Apex Code': [],
    'UI Components': []
  };
  
  // If issues exist, categorize them
  if (healthScore.issues) {
    const issues = healthScore.issues as HealthScoreIssue[];
    issues.forEach(issue => {
      switch (issue.category) {
        case 'security':
          issuesByCategory['Security & Access'].push(issue);
          break;
        case 'dataModel':
          issuesByCategory['Data Model'].push(issue);
          break;
        case 'automation':
          issuesByCategory['Automation Logic'].push(issue);
          break;
        case 'apex':
          issuesByCategory['Apex Code'].push(issue);
          break;
        case 'ui':
          issuesByCategory['UI Components'].push(issue);
          break;
      }
    });
  }
  
  // Function to get icon based on severity
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <div className="h-5 w-5 text-red-500 rounded-full bg-red-100 flex items-center justify-center">
          <AlertTriangle className="h-3 w-3" />
        </div>;
      case 'warning':
        return <div className="h-5 w-5 text-amber-500 rounded-full bg-amber-100 flex items-center justify-center">
          <AlertTriangle className="h-3 w-3" />
        </div>;
      default:
        return <div className="h-5 w-5 text-blue-500 rounded-full bg-blue-100 flex items-center justify-center">
          <Info className="h-3 w-3" />
        </div>;
    }
  };

  // Function to determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-500";
    if (score >= 75) return "text-amber-600 bg-amber-500";
    return "text-red-600 bg-red-500";
  };
  
  return (
    <div className="space-y-6">
      {/* Overall Health Card */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className={`h-14 w-14 rounded-full flex items-center justify-center 
              ${healthScore.overallScore >= 80 ? 'bg-green-100' : 
                healthScore.overallScore >= 60 ? 'bg-amber-100' : 'bg-red-100'}`}>
              <CheckCircle className={`h-8 w-8 
                ${healthScore.overallScore >= 80 ? 'text-green-500' : 
                  healthScore.overallScore >= 60 ? 'text-amber-500' : 'text-red-500'}`} />
            </div>
            <div className="ml-6">
              <h2 className="text-xl font-bold">Overall Health</h2>
              <div className="flex items-baseline">
                <span className={`text-4xl font-bold 
                  ${healthScore.overallScore >= 80 ? 'text-green-600' : 
                    healthScore.overallScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                  {healthScore.overallScore}/100
                </span>
                {/* We could add a change indicator here if that data becomes available */}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Score Breakdown */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Score Breakdown</h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <Card key={category.name} className="shadow-sm overflow-hidden">
              <div 
                className="p-4 cursor-pointer hover:bg-neutral-50"
                onClick={() => toggleCategory(category.name)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    {expandedCategory === category.name ? 
                      <ChevronUp className="h-5 w-5 text-neutral-500 mr-2" /> : 
                      <ChevronDown className="h-5 w-5 text-neutral-500 mr-2" />
                    }
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <span className={`font-semibold ${
                    category.score >= 90 ? 'text-green-600' : 
                    category.score >= 75 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {category.score}/{category.maxScore}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="mt-2 h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      category.score >= 90 ? 'bg-green-500' : 
                      category.score >= 75 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(category.score / category.maxScore) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Expanded section with issues */}
              {expandedCategory === category.name && (
                <div className="bg-neutral-50 p-4 border-t">
                  <h4 className="text-sm font-semibold mb-2">Issues Found</h4>
                  {issuesByCategory[category.name]?.length > 0 ? (
                    <ul className="space-y-2">
                      {issuesByCategory[category.name].map((issue) => (
                        <li 
                          key={issue.id} 
                          className="flex items-center p-3 bg-white rounded-md border hover:bg-blue-50 cursor-pointer"
                          onClick={() => onIssueClick && onIssueClick(issue.id)}
                        >
                          {getSeverityIcon(issue.severity)}
                          <div className="ml-3">
                            <div className="font-medium">{issue.title}</div>
                            <div className="text-xs text-neutral-500 mt-0.5">{issue.description}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-neutral-500 p-3 bg-white rounded-md border">
                      No issues found in this category.
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}