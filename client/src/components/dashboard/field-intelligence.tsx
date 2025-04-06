import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Zap, Database, Lock, Search, Info, Clock, FileText, ShieldAlert, BarChart2, Settings, CheckSquare, XSquare, RefreshCw } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { HealthScore } from '@shared/schema';

// Custom progress component that accepts a custom className for the indicator
interface CustomProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  indicatorClassName?: string;
}

const CustomProgress = ({
  value,
  max = 100,
  className,
  indicatorClassName,
  ...props
}: CustomProgressProps) => {
  const percentage = (value / max) * 100;
  
  // Determine color based on value (higher is better for this metric)
  const getDefaultColor = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-neutral-200 ${className}`}
      {...props}
    >
      <div
        className={`h-full ${indicatorClassName || getDefaultColor()}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// Extended metrics that might not be in the main health score
interface ExtendedFieldMetrics {
  // Field usage metrics
  totalCustomFields: number;
  unusedFields: number;
  fieldsWithoutDescription: number;
  fieldsWithoutHelp: number;
  
  // Field quality metrics
  inconsistentNaming: number;
  duplicateFields: number;
  fieldUsageScore: number;
  
  // Security metrics
  fieldsWithFLS: number;
  fieldsWithHistory: number;
  sensitiveDatatypes: number;
  
  // Object relationships
  objectCount: number;
  relationshipFields: number;
  complexRelationships: number;
  
  // Top objects by field count
  topObjects: {
    name: string;
    fieldCount: number;
    unusedFields: number;
  }[];
  
  // Field by data type distribution
  fieldTypes: {
    type: string;
    count: number;
    color: string;
  }[];
  
  // Recently modified fields
  recentlyModified: {
    name: string;
    object: string;
    modifiedDate: string;
    modifiedBy: string;
  }[];
  
  // Field usage by profile
  profileAccess: {
    profile: string;
    readAccess: number;
    editAccess: number;
  }[];
}

// Example function to generate extended metrics
// In production, these would come from an API
const generateExtendedMetrics = (data: HealthScore): ExtendedFieldMetrics => {
  return {
    totalCustomFields: 1243,
    unusedFields: 86,
    fieldsWithoutDescription: 312,
    fieldsWithoutHelp: 467,
    
    inconsistentNaming: 48,
    duplicateFields: 32,
    fieldUsageScore: 76,
    
    fieldsWithFLS: 834,
    fieldsWithHistory: 156,
    sensitiveDatatypes: 83,
    
    objectCount: 178,
    relationshipFields: 423,
    complexRelationships: 37,
    
    topObjects: [
      { name: 'Account', fieldCount: 126, unusedFields: 14 },
      { name: 'Contact', fieldCount: 98, unusedFields: 11 },
      { name: 'Opportunity', fieldCount: 87, unusedFields: 9 },
      { name: 'Custom_Object__c', fieldCount: 64, unusedFields: 21 },
      { name: 'Case', fieldCount: 58, unusedFields: 7 },
    ],
    
    fieldTypes: [
      { type: 'Text', count: 543, color: '#3B82F6' },
      { type: 'Number', count: 187, color: '#10B981' },
      { type: 'Date', count: 124, color: '#F59E0B' },
      { type: 'Lookup', count: 236, color: '#8B5CF6' },
      { type: 'Picklist', count: 198, color: '#EC4899' },
      { type: 'Checkbox', count: 94, color: '#6B7280' },
      { type: 'Other', count: 67, color: '#9CA3AF' },
    ],
    
    recentlyModified: [
      { name: 'Custom_Field__c', object: 'Account', modifiedDate: '2025-04-01', modifiedBy: 'Admin User' },
      { name: 'Status__c', object: 'Case', modifiedDate: '2025-03-28', modifiedBy: 'System Integrator' },
      { name: 'Priority__c', object: 'Task', modifiedDate: '2025-03-25', modifiedBy: 'Admin User' },
      { name: 'Revenue__c', object: 'Opportunity', modifiedDate: '2025-03-22', modifiedBy: 'Sales Admin' },
    ],
    
    profileAccess: [
      { profile: 'System Administrator', readAccess: 100, editAccess: 98 },
      { profile: 'Sales Profile', readAccess: 76, editAccess: 52 },
      { profile: 'Service Profile', readAccess: 63, editAccess: 41 },
      { profile: 'Marketing Profile', readAccess: 58, editAccess: 32 },
    ],
  };
};

// Main component
interface FieldIntelligenceProps {
  orgId: number;
  healthScore?: HealthScore;
  isLoading?: boolean;
  onActionClick?: (actionId: string) => void;
}

export function FieldIntelligence({ 
  orgId,
  healthScore, 
  isLoading = false,
  onActionClick
}: FieldIntelligenceProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // Simulating loading state
  if (isLoading) {
    return (
      <div className="w-full p-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  // If no health score is provided, use mock data
  const data: HealthScore = healthScore || getMockHealthScore();
  const extendedMetrics = generateExtendedMetrics(data);
  
  // Function to generate mock health score if needed
  function getMockHealthScore(): HealthScore {
    return {
      id: 1,
      orgId: orgId,
      overallScore: 68,
      securityScore: 72,
      dataModelScore: 65,
      automationScore: 73,
      apexScore: 61,
      uiComponentScore: 70,
      complexityScore: 62,
      performanceRisk: 58,
      technicalDebt: 54,
      metadataVolume: 75,
      customizationLevel: 68,
      lastAnalyzed: new Date(),
      issues: []
    };
  }
  
  // Functions to handle action clicks
  const handleAction = (actionId: string) => {
    if (onActionClick) {
      onActionClick(actionId);
    } else {
      toast({
        title: "Action triggered",
        description: `Action ${actionId} would be executed in production`,
      });
    }
  };
  
  return (
    <div className="w-full">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="action-plan">Action Plan</TabsTrigger>
          <TabsTrigger value="detailed-metrics">Detailed Metrics</TabsTrigger>
        </TabsList>
        
        {/* OVERVIEW TAB */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Field Usage Summary Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Database className="h-5 w-5 mr-2 text-blue-500" />
                  Field Usage Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Total Custom Fields</span>
                    <span className="font-medium">{extendedMetrics.totalCustomFields}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm text-neutral-600">Unused Fields</span>
                      <Badge variant="destructive" className="ml-2">
                        {Math.round((extendedMetrics.unusedFields / extendedMetrics.totalCustomFields) * 100)}%
                      </Badge>
                    </div>
                    <span className="font-medium">{extendedMetrics.unusedFields}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Fields Without Description</span>
                    <span className="font-medium">{extendedMetrics.fieldsWithoutDescription}</span>
                  </div>
                  
                  <CustomProgress
                    value={extendedMetrics.fieldUsageScore}
                    className="h-2 mt-2"
                    indicatorClassName="bg-blue-500"
                  />
                  <div className="flex justify-between text-xs">
                    <span>Field Usage Score</span>
                    <span>{extendedMetrics.fieldUsageScore}/100</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleAction('analyze-unused-fields')}
                >
                  Analyze Unused Fields
                </Button>
              </CardFooter>
            </Card>
            
            {/* Field Documentation Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-purple-500" />
                  Field Documentation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Fields Without Help Text</span>
                    <span className="font-medium">{extendedMetrics.fieldsWithoutHelp}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Fields Without Description</span>
                    <span className="font-medium">{extendedMetrics.fieldsWithoutDescription}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Inconsistent Naming</span>
                    <span className="font-medium">{extendedMetrics.inconsistentNaming}</span>
                  </div>
                  
                  <Alert className="bg-amber-50 border-amber-200 text-amber-800 mt-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800 text-sm font-medium">Documentation Gaps</AlertTitle>
                    <AlertDescription className="text-amber-700 text-xs">
                      {Math.round((extendedMetrics.fieldsWithoutHelp / extendedMetrics.totalCustomFields) * 100)}% of fields lack proper documentation.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleAction('generate-field-documentation')}
                >
                  Generate Documentation
                </Button>
              </CardFooter>
            </Card>
            
            {/* Field Security Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-red-500" />
                  Field Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Fields with FLS</span>
                    <span className="font-medium">{extendedMetrics.fieldsWithFLS}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Sensitive Data Fields</span>
                    <span className="font-medium">{extendedMetrics.sensitiveDatatypes}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">History Tracked Fields</span>
                    <span className="font-medium">{extendedMetrics.fieldsWithHistory}</span>
                  </div>
                  
                  <Alert className="bg-green-50 border-green-200 text-green-800 mt-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800 text-sm font-medium">Security Status</AlertTitle>
                    <AlertDescription className="text-green-700 text-xs">
                      {Math.round((extendedMetrics.fieldsWithFLS / extendedMetrics.totalCustomFields) * 100)}% of fields have proper security controls.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleAction('audit-field-security')}
                >
                  Audit Field Security
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Objects by Field Count */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <BarChart2 className="h-5 w-5 mr-2 text-blue-500" />
                  Top Objects by Field Count
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {extendedMetrics.topObjects.map((obj, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className="w-1/3 text-sm">{obj.name}</div>
                      <div className="w-2/3 relative pt-1">
                        <div className="flex mb-1">
                          <div className="w-full bg-blue-200 rounded-full h-2.5">
                            <div 
                              className="bg-blue-500 h-2.5 rounded-full" 
                              style={{ width: `${(obj.fieldCount / Math.max(...extendedMetrics.topObjects.map(o => o.fieldCount))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs ml-2 w-12 text-right">{obj.fieldCount}</span>
                        </div>
                        <div className="flex mb-2">
                          <div className="w-full bg-red-200 rounded-full h-1.5">
                            <div 
                              className="bg-red-500 h-1.5 rounded-full" 
                              style={{ width: `${(obj.unusedFields / obj.fieldCount) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs ml-2 w-12 text-right text-red-500">{obj.unusedFields}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-neutral-500 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                    <span>Total Fields</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                    <span>Unused Fields</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleAction('view-object-details')}
                >
                  View Object Details
                </Button>
              </CardFooter>
            </Card>
            
            {/* Field Types Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <PieChart 
                    data={extendedMetrics.fieldTypes.map(type => ({
                      value: type.count,
                      color: type.color,
                      label: type.type
                    }))} 
                    className="h-5 w-5 mr-2" 
                  />
                  Field Types Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {extendedMetrics.fieldTypes.map((type, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }}></div>
                      <div className="text-sm">{type.type}</div>
                      <div className="text-sm font-medium ml-auto">{type.count}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center text-sm text-neutral-600">
                  Total: {extendedMetrics.fieldTypes.reduce((sum, type) => sum + type.count, 0)} fields
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleAction('analyze-field-types')}
                >
                  Analyze Field Types
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* ACTION PLAN TAB */}
        <TabsContent value="action-plan">
          <Card>
            <CardHeader>
              <CardTitle>Field Intelligence Action Plan</CardTitle>
              <CardDescription>
                Prioritized actions to optimize your Salesforce fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* High Priority Actions */}
                <div>
                  <h3 className="font-medium text-red-600 flex items-center mb-2">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    High Priority Actions
                  </h3>
                  <div className="space-y-2">
                    <ActionItem
                      title="Remove 37 unused fields from Account object"
                      description="These fields haven't been used in over 12 months and are candidates for deletion."
                      impact="Reduces maintenance overhead and improves page load performance."
                      actionId="remove-unused-account-fields"
                      actionLabel="Analyze & Remove"
                      onAction={handleAction}
                    />
                    
                    <ActionItem
                      title="Add FLS to 18 sensitive data fields"
                      description="Several fields containing PII lack proper field-level security."
                      impact="Improves data security compliance and reduces risk."
                      actionId="secure-sensitive-fields"
                      actionLabel="Secure Fields"
                      onAction={handleAction}
                    />
                    
                    <ActionItem
                      title="Standardize picklist values across 12 status fields"
                      description="Inconsistent picklist values found across similar fields."
                      impact="Improves data consistency and reporting reliability."
                      actionId="standardize-picklists"
                      actionLabel="Standardize Values"
                      onAction={handleAction}
                    />
                  </div>
                </div>
                
                {/* Medium Priority Actions */}
                <div>
                  <h3 className="font-medium text-amber-600 flex items-center mb-2">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Medium Priority Actions
                  </h3>
                  <div className="space-y-2">
                    <ActionItem
                      title="Add help text to 312 fields missing documentation"
                      description="These fields lack proper help text, making them difficult for users to understand."
                      impact="Improves user experience and adoption."
                      actionId="add-help-text"
                      actionLabel="Generate Help Text"
                      onAction={handleAction}
                    />
                    
                    <ActionItem
                      title="Consolidate 32 duplicate fields across objects"
                      description="Similar fields found across multiple objects could be consolidated."
                      impact="Simplifies data model and improves maintenance."
                      actionId="consolidate-fields"
                      actionLabel="View Duplicates"
                      onAction={handleAction}
                    />
                  </div>
                </div>
                
                {/* Low Priority Actions */}
                <div>
                  <h3 className="font-medium text-green-600 flex items-center mb-2">
                    <Info className="h-4 w-4 mr-2" />
                    Low Priority Actions
                  </h3>
                  <div className="space-y-2">
                    <ActionItem
                      title="Update 48 fields with inconsistent naming conventions"
                      description="Field names don't follow your organization's naming conventions."
                      impact="Improves consistency and maintainability."
                      actionId="fix-naming-conventions"
                      actionLabel="Fix Naming"
                      onAction={handleAction}
                    />
                    
                    <ActionItem
                      title="Enable field history tracking on 24 critical fields"
                      description="Important fields missing audit history tracking."
                      impact="Improves auditability and compliance."
                      actionId="enable-history-tracking"
                      actionLabel="Enable Tracking"
                      onAction={handleAction}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* DETAILED METRICS TAB */}
        <TabsContent value="detailed-metrics">
          <Card>
            <CardHeader>
              <CardTitle>Field Intelligence Detailed Metrics</CardTitle>
              <CardDescription>
                Comprehensive analysis of your Salesforce fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="usage">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-blue-500" />
                      <span>Field Usage Statistics</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Custom Fields</div>
                          <div className="text-lg font-semibold">{extendedMetrics.totalCustomFields}</div>
                          <div className="text-xs text-amber-600">{extendedMetrics.unusedFields} unused for &gt;6 months</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Objects</div>
                          <div className="text-lg font-semibold">{extendedMetrics.objectCount}</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Relationship Fields</div>
                          <div className="text-lg font-semibold">{extendedMetrics.relationshipFields}</div>
                          <div className="text-xs text-amber-600">{extendedMetrics.complexRelationships} complex relationships</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Field Modifications</div>
                          <div className="text-lg font-semibold">168</div>
                          <div className="text-xs text-blue-600">Last 30 days</div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm text-neutral-500">Field Usage Score</div>
                        <CustomProgress value={extendedMetrics.fieldUsageScore} className="h-2" />
                        <div className="flex justify-between text-xs">
                          <span>{extendedMetrics.fieldUsageScore}/100</span>
                          <span className="text-neutral-500">Higher is better</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Recently Modified Fields</h3>
                        <div className="space-y-2">
                          {extendedMetrics.recentlyModified.map((field, i) => (
                            <div key={i} className="flex items-center justify-between text-sm border rounded p-2">
                              <div>
                                <span className="font-medium">{field.name}</span>
                                <span className="text-neutral-500 ml-1">({field.object})</span>
                              </div>
                              <div className="text-xs text-neutral-500">
                                {field.modifiedDate} by {field.modifiedBy}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="security">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-red-500" />
                      <span>Field Security Analysis</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Fields with FLS</div>
                          <div className="text-lg font-semibold">{extendedMetrics.fieldsWithFLS}</div>
                          <div className="text-xs text-green-600">{Math.round((extendedMetrics.fieldsWithFLS / extendedMetrics.totalCustomFields) * 100)}% coverage</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Sensitive Data Fields</div>
                          <div className="text-lg font-semibold">{extendedMetrics.sensitiveDatatypes}</div>
                          <div className="text-xs text-amber-600">Needs review</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">History Tracked</div>
                          <div className="text-lg font-semibold">{extendedMetrics.fieldsWithHistory}</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Encrypted Fields</div>
                          <div className="text-lg font-semibold">24</div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Profile Access Levels</h3>
                        <div className="space-y-3">
                          {extendedMetrics.profileAccess.map((profile, i) => (
                            <div key={i}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm">{profile.profile}</span>
                                <div>
                                  <span className="text-xs text-blue-600 mr-3">Read: {profile.readAccess}%</span>
                                  <span className="text-xs text-green-600">Edit: {profile.editAccess}%</span>
                                </div>
                              </div>
                              <div className="w-full bg-neutral-200 rounded-full h-1.5 mb-1">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${profile.readAccess}%` }}></div>
                              </div>
                              <div className="w-full bg-neutral-200 rounded-full h-1.5">
                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${profile.editAccess}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                        <ShieldAlert className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="text-amber-800">Security Review Needed</AlertTitle>
                        <AlertDescription className="text-amber-700">
                          Some sensitive data fields may need additional security controls based on your compliance requirements.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="documentation">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-purple-500" />
                      <span>Field Documentation</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Fields with Help Text</div>
                          <div className="text-lg font-semibold">{extendedMetrics.totalCustomFields - extendedMetrics.fieldsWithoutHelp}</div>
                          <div className="text-xs text-amber-600">{Math.round(((extendedMetrics.totalCustomFields - extendedMetrics.fieldsWithoutHelp) / extendedMetrics.totalCustomFields) * 100)}% coverage</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Fields with Description</div>
                          <div className="text-lg font-semibold">{extendedMetrics.totalCustomFields - extendedMetrics.fieldsWithoutDescription}</div>
                          <div className="text-xs text-amber-600">{Math.round(((extendedMetrics.totalCustomFields - extendedMetrics.fieldsWithoutDescription) / extendedMetrics.totalCustomFields) * 100)}% coverage</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Inconsistent Naming</div>
                          <div className="text-lg font-semibold">{extendedMetrics.inconsistentNaming}</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Documentation Score</div>
                          <div className="text-lg font-semibold">68/100</div>
                          <div className="text-xs text-amber-600">Needs improvement</div>
                        </div>
                      </div>
                      
                      <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-800">Documentation Opportunity</AlertTitle>
                        <AlertDescription className="text-blue-700">
                          Adding field help text can improve user adoption and data quality. Consider bulk-updating help text for commonly used fields.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="border rounded p-3">
                        <h3 className="text-sm font-medium mb-2">Documentation Tool</h3>
                        <p className="text-sm text-neutral-600 mb-3">
                          Generate help text and descriptions for undocumented fields using AI assistance.
                        </p>
                        <Button 
                          size="sm" 
                          onClick={() => handleAction('batch-documentation-generator')}
                          className="w-full"
                        >
                          Launch Documentation Tool
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="optimization">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-neutral-500" />
                      <span>Field Optimization</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 p-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Duplicate Fields</div>
                          <div className="text-lg font-semibold">{extendedMetrics.duplicateFields}</div>
                          <div className="text-xs text-red-600">Consolidation needed</div>
                        </div>
                        
                        <div className="border rounded p-3">
                          <div className="text-sm text-neutral-500">Unused Fields</div>
                          <div className="text-lg font-semibold">{extendedMetrics.unusedFields}</div>
                          <div className="text-xs text-red-600">Removal candidates</div>
                        </div>
                      </div>
                      
                      <div className="border p-3 rounded">
                        <h3 className="text-sm font-medium mb-2">Field Optimization Recommendations</h3>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <CheckSquare className="h-4 w-4 text-green-500 mr-2" />
                            <span>Consolidate 14 similar date fields on Account</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <CheckSquare className="h-4 w-4 text-green-500 mr-2" />
                            <span>Remove 32 legacy fields from Custom_Object__c</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <CheckSquare className="h-4 w-4 text-green-500 mr-2" />
                            <span>Convert 8 text fields to picklists for better data quality</span>
                          </div>
                          <div className="flex items-center text-sm">
                            <CheckSquare className="h-4 w-4 text-green-500 mr-2" />
                            <span>Change data type for 6 number fields to improve precision</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => handleAction('field-optimizer')}
                          className="flex-1"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Run Field Optimizer
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleAction('download-optimization-report')}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper component for rendering action items
interface ActionItemProps {
  title: string;
  description: string;
  impact: string;
  actionId: string;
  actionLabel: string;
  onAction: (actionId: string) => void;
}

function ActionItem({ 
  title, 
  description, 
  impact, 
  actionId, 
  actionLabel, 
  onAction 
}: ActionItemProps) {
  return (
    <div className="border rounded-lg p-3 hover:shadow-sm transition-shadow">
      <h4 className="font-medium text-sm">{title}</h4>
      <p className="text-xs text-neutral-600 mt-1 mb-2">{description}</p>
      <div className="flex items-center justify-between mt-2">
        <div className="text-xs text-blue-600">
          <span className="font-medium">Impact:</span> {impact}
        </div>
        <Button 
          size="sm" 
          variant="secondary"
          onClick={() => onAction(actionId)}
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

// Simple pie chart component
interface PieChartProps {
  data: {
    value: number;
    color: string;
    label: string;
  }[];
  className?: string;
}

function PieChart({ data, className }: PieChartProps) {
  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Generate SVG path for pie segments
  let startAngle = 0;
  
  return (
    <svg viewBox="0 0 32 32" className={className}>
      <g transform="translate(16, 16)">
        {data.map((item, i) => {
          // Calculate angles for this segment
          const percentage = item.value / total;
          const angle = percentage * 360;
          const endAngle = startAngle + angle;
          
          // Calculate path
          const x1 = Math.cos(startAngle * Math.PI / 180) * 16;
          const y1 = Math.sin(startAngle * Math.PI / 180) * 16;
          const x2 = Math.cos(endAngle * Math.PI / 180) * 16;
          const y2 = Math.sin(endAngle * Math.PI / 180) * 16;
          
          // Create path element
          const path = `M 0 0 L ${x1} ${y1} A 16 16 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`;
          
          // Update start angle for next segment
          startAngle = endAngle;
          
          return (
            <path
              key={i}
              d={path}
              fill={item.color}
              stroke="white"
              strokeWidth="0.5"
            />
          );
        })}
      </g>
    </svg>
  );
}

export default FieldIntelligence;