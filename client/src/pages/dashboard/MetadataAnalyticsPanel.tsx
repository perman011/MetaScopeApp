import React from "react";
import { 
  PieChart, 
  Pie, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell, 
  ResponsiveContainer 
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Mock data for the donut chart
const customVsStandardData = [
  { name: 'Custom Components', value: 125 },
  { name: 'Standard Components', value: 285 },
];

// Mock data for the bar chart
const componentsByTypeData = [
  { type: 'ApexClass', count: 52 },
  { type: 'Flow', count: 34 },
  { type: 'Field', count: 879 },
  { type: 'Object', count: 25 },
  { type: 'Layout', count: 43 },
];

// Mock data for the referenced components table
const referencedComponentsData = [
  { type: 'ApexClass', name: 'AccountTriggerHandler', referenceCount: 106, lastModified: 'Mar 15, 2024' },
  { type: 'Flow', name: 'Opportiunity Assignment Flow', referenceCount: 87, lastModified: 'Feb 20, 2024' },
  { type: 'Field', name: 'Contact Email', referenceCount: 74, lastModified: 'Jan 10, 2024' },
  { type: 'ApexClass', name: 'LeadConversionController', referenceCount: 58, lastModified: 'Dec 5, 2023' },
  { type: 'Object', name: 'Account', referenceCount: 53, lastModified: 'Nov 12, 2023' },
  { type: 'Trigger', name: 'ContactTrigger', referenceCount: 48, lastModified: 'Apr 2, 2024' },
  { type: 'Flow', name: 'Case Assignment', referenceCount: 45, lastModified: 'Mar 8, 2024' },
  { type: 'ApexClass', name: 'OpportunityService', referenceCount: 42, lastModified: 'Oct 25, 2023' },
  { type: 'Layout', name: 'Account Layout', referenceCount: 40, lastModified: 'Sep 20, 2023' },
  { type: 'Field', name: 'Opportunity Amount', referenceCount: 39, lastModified: 'Aug 15, 2023' },
];

// Mock data for stale components
const staleComponentsData = [
  { type: 'ApexClass', name: 'OldAccountReview', lastUsed: 'Nov 2022' },
  { type: 'ValidationRule', name: 'RequireContactInfo', lastUsed: 'May 2022' },
  { type: 'ApexClass', name: 'LegacyBillingHandler', lastUsed: 'Jan 2022' },
  { type: 'Flow', name: 'OutdatedOnboarding', lastUsed: 'Dec 2021' },
  { type: 'Trigger', name: 'DeprecatedCaseTrigger', lastUsed: 'Oct 2021' },
  { type: 'Layout', name: 'Old_Contact_Layout', lastUsed: 'Aug 2021' },
];

// Colors for charts
const DONUT_COLORS = ['#3b82f6', '#22c55e']; // blue-500, green-500
const BAR_COLOR = '#60a5fa'; // blue-400

export default function MetadataAnalyticsPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
      {/* Chart 1: Custom vs Standard Components */}
      <Card>
        <CardHeader>
          <CardTitle>Custom vs Standard Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={customVsStandardData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {customVsStandardData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} components`, null]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Chart 2: Component Count by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Component Count by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={componentsByTypeData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="type" width={80} />
                <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
                <Legend />
                <Bar dataKey="count" fill={BAR_COLOR} name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Table: Most Referenced Components */}
      <Card>
        <CardHeader>
          <CardTitle>Most Referenced Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Reference Count</TableHead>
                  <TableHead>Last Modified (Date)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referencedComponentsData.map((component, index) => (
                  <TableRow key={index} className="cursor-pointer hover:bg-neutral-50">
                    <TableCell>{component.type}</TableCell>
                    <TableCell>{component.name}</TableCell>
                    <TableCell className="text-right">{component.referenceCount}</TableCell>
                    <TableCell>{component.lastModified}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* List: Stale Components */}
      <Card>
        <CardHeader>
          <CardTitle>Stale Components (&gt;6 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-y-auto max-h-[400px]">
            <ul className="space-y-3">
              {staleComponentsData.map((component, index) => (
                <li key={index} className="pb-2 border-b border-neutral-200 last:border-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <div>
                      <span className="font-medium">{component.type}:</span> {component.name}
                    </div>
                    <div className="text-sm text-neutral-500">
                      Last Used: {component.lastUsed}
                    </div>
                  </div>
                  <div className="mt-1">
                    <span className="text-primary-600 hover:text-primary-800 text-sm cursor-pointer">
                      View Metadata
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}