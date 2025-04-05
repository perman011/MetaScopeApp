import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, AlertCircle, Info, ExternalLink, CheckCircle2 } from "lucide-react";
import { HealthScoreIssue } from "@shared/schema";

interface IssueDetailsCardProps {
  issue: HealthScoreIssue;
  onAutoFix?: (issueId: string) => void;
  isFixable?: boolean;
}

export default function IssueDetailsCard({ issue, onAutoFix, isFixable = false }: IssueDetailsCardProps) {
  // Icon based on severity
  const getIcon = () => {
    switch (issue.severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  // Badge color based on severity
  const getBadgeVariant = () => {
    switch (issue.severity) {
      case 'critical':
        return "destructive" as const;
      case 'warning':
        return "outline" as const; // Using outline instead of warning since it's not available
      case 'info':
        return "secondary" as const;
      default:
        return "secondary" as const;
    }
  };

  // Category label
  const getCategoryLabel = () => {
    switch (issue.category) {
      case 'security':
        return "Security & Access";
      case 'dataModel':
        return "Data Model";
      case 'automation':
        return "Automation Logic";
      case 'apex':
        return "Apex Code";
      case 'ui':
        return "UI Components";
      default:
        return issue.category;
    }
  };

  // Category badge color
  const getCategoryVariant = () => {
    switch (issue.category) {
      case 'security':
        return "outline" as const;
      case 'dataModel':
        return "outline" as const;
      case 'automation':
        return "outline" as const;
      case 'apex':
        return "outline" as const;
      case 'ui':
        return "outline" as const;
      default:
        return "outline" as const;
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex gap-2 items-center">
            {getIcon()}
            <CardTitle className="text-lg">{issue.title}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant={getCategoryVariant()}>{getCategoryLabel()}</Badge>
            <Badge variant={getBadgeVariant()}>
              {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <div className="font-medium mb-1">Description</div>
          <p className="text-neutral-700">{issue.description}</p>
        </div>
        <div>
          <div className="font-medium mb-1">Impact</div>
          <p className="text-neutral-700">{issue.impact}</p>
        </div>
        <div>
          <div className="font-medium mb-1">Recommendation</div>
          <p className="text-neutral-700">{issue.recommendation}</p>
        </div>
      </CardContent>
      <CardFooter className="justify-between border-t pt-4">
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4 mr-2" />
          Learn More
        </Button>
        {isFixable && onAutoFix ? (
          <Button size="sm" onClick={() => onAutoFix(issue.id)}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Auto-Fix Issue
          </Button>
        ) : (
          <Button variant="secondary" size="sm">
            View Details
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}