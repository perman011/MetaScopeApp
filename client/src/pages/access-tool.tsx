import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useOrg } from "@/hooks/use-org";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  User, 
  Shield, 
  AlertCircle, 
  RefreshCw,
  Download,
  Copy,
  CheckSquare,
  Database,
  Lock,
  Eye,
  CheckIcon,
  XIcon,
  KeyRound,
  FilePenLine,
  FileCheck,
  AlertTriangle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

// Sample access data
const accessData = {
  profiles: [
    { id: 1, name: "System Administrator", description: "Complete system access" },
    { id: 2, name: "Standard User", description: "Standard platform user" },
    { id: 3, name: "Custom Sales Profile", description: "Custom profile for sales representatives" },
    { id: 4, name: "Marketing User", description: "Access to marketing features" },
    { id: 5, name: "Contract Manager", description: "Manages contract-related records" },
  ],
  permissionSets: [
    { id: 1, name: "API Access", description: "Provides API access permissions" },
    { id: 2, name: "Report Builder", description: "Enhanced report creation capabilities" },
    { id: 3, name: "Sales Insights", description: "Access to sales analytics" },
    { id: 4, name: "Custom Object Admin", description: "Administer custom objects" },
    { id: 5, name: "Data Export", description: "Ability to export data" },
  ],
  users: [
    { id: 1, name: "John Doe", email: "john.doe@example.com", profile: "System Administrator", isActive: true },
    { id: 2, name: "Jane Smith", email: "jane.smith@example.com", profile: "Standard User", isActive: true },
    { id: 3, name: "Mike Johnson", email: "mike.johnson@example.com", profile: "Custom Sales Profile", isActive: true },
    { id: 4, name: "Sarah Williams", email: "sarah.williams@example.com", profile: "Marketing User", isActive: false },
    { id: 5, name: "Chris Taylor", email: "chris.taylor@example.com", profile: "Contract Manager", isActive: true },
  ]
};

// Access categories and permissions
const accessCategories = [
  {
    name: "Administrative Access",
    permissions: [
      { name: "Modify All Data", description: "Allows creating, editing, and deleting all data", risk: "high" },
      { name: "View All Data", description: "Allows viewing all data", risk: "medium" },
      { name: "Manage Users", description: "Create and edit users", risk: "high" },
      { name: "Assign Permission Sets", description: "Assign permission sets to users", risk: "medium" },
      { name: "Manage Profiles and Permission Sets", description: "Create and edit profiles and permission sets", risk: "high" },
    ]
  },
  {
    name: "General User Access",
    permissions: [
      { name: "API Enabled", description: "Access Salesforce through APIs", risk: "medium" },
      { name: "Create Export Reports", description: "Create and export reports", risk: "low" },
      { name: "Edit Events", description: "Create and edit events", risk: "low" },
      { name: "Edit Tasks", description: "Create and edit tasks", risk: "low" },
      { name: "Run Reports", description: "Run reports", risk: "low" },
    ]
  },
  {
    name: "Data Access",
    permissions: [
      { name: "Export Reports", description: "Export report data", risk: "medium" },
      { name: "Manage Dashboards", description: "Create, edit, and delete dashboards", risk: "low" },
      { name: "Manage Reports", description: "Create, edit, and delete reports", risk: "low" },
      { name: "View Dashboards", description: "View dashboards", risk: "low" },
      { name: "View Reports", description: "View reports", risk: "low" },
    ]
  },
  {
    name: "Object Access",
    permissions: [
      { name: "Account: Create", description: "Create accounts", risk: "low" },
      { name: "Account: Read", description: "View accounts", risk: "low" },
      { name: "Account: Edit", description: "Edit accounts", risk: "low" },
      { name: "Account: Delete", description: "Delete accounts", risk: "medium" },
      { name: "Account: View All", description: "View all accounts", risk: "medium" },
    ]
  },
];

// Sample current access for different items
const currentAccess = {
  "System Administrator": {
    "Modify All Data": true,
    "View All Data": true,
    "Manage Users": true,
    "API Enabled": true,
    "Account: Create": true,
    "Account: Read": true,
    "Account: Edit": true,
    "Account: Delete": true,
  },
  "Standard User": {
    "Modify All Data": false,
    "View All Data": false,
    "Manage Users": false,
    "API Enabled": true,
    "Account: Create": true,
    "Account: Read": true,
    "Account: Edit": true,
    "Account: Delete": false,
  },
  "API Access": {
    "API Enabled": true,
    "Export Reports": true,
    "Manage Reports": false,
    "View Reports": true,
  },
  "John Doe": {
    "Modify All Data": true,
    "View All Data": true,
    "Manage Users": true,
    "API Enabled": true,
  }
};

// Types for access data
interface AccessItem {
  id: number;
  name: string;
  description?: string;
  profile?: string;
  email?: string;
  isActive?: boolean;
}

interface AccessCategory {
  name: string;
  permissions: {
    name: string;
    description: string;
    risk: "low" | "medium" | "high";
  }[];
}

// Security recommendations
const securityRecommendations = [
  {
    id: 1,
    type: "profile",
    name: "System Administrator",
    issue: "High-risk permissions assigned to too many users",
    recommendation: "Limit System Administrator profile assignment",
    risk: "high"
  },
  {
    id: 2,
    type: "permission",
    name: "Modify All Data",
    issue: "Excessive data modification rights",
    recommendation: "Restrict to only necessary users",
    risk: "high"
  },
  {
    id: 3,
    type: "profile",
    name: "Standard User",
    issue: "API access unnecessarily enabled",
    recommendation: "Disable API access for standard users",
    risk: "medium"
  },
  {
    id: 4,
    type: "user",
    name: "John Doe",
    issue: "Unused high privilege access",
    recommendation: "Review access and remove unnecessary permissions",
    risk: "medium"
  },
  {
    id: 5,
    type: "permission",
    name: "Account: Delete",
    issue: "Delete access broadly assigned",
    recommendation: "Restrict delete access to specific roles",
    risk: "medium"
  }
];

export default function AccessTool() {
  const { currentOrg } = useOrg();
  const [searchTerm, setSearchTerm] = useState("");
  const [accessType, setAccessType] = useState<"profiles" | "permissionSets" | "users">("profiles");
  const [selectedItem, setSelectedItem] = useState<AccessItem | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "edit" | "remediate">("view");
  const [activeTab, setActiveTab] = useState<"access" | "recommendations">("access");

  // Filter access items based on search term
  const filteredItems = accessType ? 
    accessData[accessType]
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) 
    : [];

  // Check if a permission is enabled for the selected item
  const isPermissionEnabled = (permissionName: string) => {
    if (!selectedItem) return false;
    
    return selectedItem.name in currentAccess 
      ? currentAccess[selectedItem.name as keyof typeof currentAccess][permissionName as keyof typeof currentAccess[keyof typeof currentAccess]] || false
      : false;
  };

  // Handle permission toggle
  const handlePermissionToggle = (permissionName: string) => {
    // This would update the permission on the backend in a real implementation
    console.log(`Toggling ${permissionName} for ${selectedItem?.name}`);
  };

  // Filter recommendations based on risk level
  const getFilteredRecommendations = (risk?: "low" | "medium" | "high") => {
    if (!risk) return securityRecommendations;
    return securityRecommendations.filter(rec => rec.risk === risk);
  };

  // Get appropriate icon for access type
  const getAccessTypeIcon = (type: string) => {
    switch (type) {
      case "profiles":
        return <Shield className="h-4 w-4" />;
      case "permissionSets":
        return <CheckSquare className="h-4 w-4" />;
      case "users":
        return <User className="h-4 w-4" />;
      default:
        return <KeyRound className="h-4 w-4" />;
    }
  };

  // Get icon for recommendation type
  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case "profile":
        return <Shield className="h-4 w-4" />;
      case "permission":
        return <KeyRound className="h-4 w-4" />;
      case "user":
        return <User className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Get color for risk level
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-neutral-100 text-neutral-800 border-neutral-200";
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800">Access Tool</h1>
            <p className="text-neutral-600">
              Analyze, manage, and remediate Salesforce access control issues
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {!currentOrg && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No org selected</AlertTitle>
            <AlertDescription>
              Please select a Salesforce org to analyze access controls.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="access" onValueChange={(value) => setActiveTab(value as "access" | "recommendations")}>
          <TabsList className="mb-6">
            <TabsTrigger value="access" className="flex items-center">
              <KeyRound className="h-4 w-4 mr-2" />
              Access Analysis
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center">
              <FileCheck className="h-4 w-4 mr-2" />
              Security Recommendations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="access">
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
              {/* Left Panel - Access Selection */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Select Target</CardTitle>
                  <CardDescription>
                    Choose a profile, permission set, or user to view access settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Tabs defaultValue="profiles" onValueChange={(value) => setAccessType(value as "profiles" | "permissionSets" | "users")}>
                    <TabsList className="grid grid-cols-3 mb-4">
                      <TabsTrigger value="profiles" className="flex items-center justify-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Profiles
                      </TabsTrigger>
                      <TabsTrigger value="permissionSets" className="flex items-center justify-center">
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Perm Sets
                      </TabsTrigger>
                      <TabsTrigger value="users" className="flex items-center justify-center">
                        <User className="h-4 w-4 mr-2" />
                        Users
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder={`Search ${accessType}...`}
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <ScrollArea className="h-[calc(100vh-32rem)] rounded border">
                    <div className="p-4">
                      <h3 className="font-medium text-sm mb-3">{accessType.charAt(0).toUpperCase() + accessType.slice(1)} ({filteredItems.length})</h3>
                      <ul className="space-y-2">
                        {filteredItems.map((item) => (
                          <li key={item.id}>
                            <button
                              onClick={() => setSelectedItem(item)}
                              className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-neutral-100 flex items-center justify-between ${selectedItem?.id === item.id ? 'bg-neutral-100 font-medium' : ''}`}
                            >
                              <div className="flex items-center">
                                {getAccessTypeIcon(accessType)}
                                <span className="ml-2 truncate">{item.name}</span>
                              </div>
                              {accessType === "users" && 'isActive' in item && !item.isActive && (
                                <Badge variant="outline" className="bg-neutral-100 text-neutral-600">
                                  Inactive
                                </Badge>
                              )}
                            </button>
                          </li>
                        ))}
                        {filteredItems.length === 0 && (
                          <li className="text-center text-sm text-neutral-500 py-4">
                            No {accessType} found
                          </li>
                        )}
                      </ul>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
              
              {/* Right Panel - Access Details */}
              <Card className="lg:col-span-5">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>
                        {selectedItem ? selectedItem.name : "Access Details"}
                      </CardTitle>
                      <CardDescription>
                        {selectedItem 
                          ? accessType === "users" 
                            ? 'profile' in selectedItem ? `User profile: ${selectedItem.profile}` : ""
                            : selectedItem.description
                          : "Select a profile, permission set, or user to view access settings"}
                      </CardDescription>
                    </div>
                    
                    {selectedItem && (
                      <div className="flex gap-2">
                        {viewMode === "view" && (
                          <Button variant="outline" size="sm" onClick={() => setViewMode("edit")}>
                            <FilePenLine className="h-4 w-4 mr-2" />
                            Edit Access
                          </Button>
                        )}
                        {viewMode === "edit" && (
                          <Button variant="outline" size="sm" onClick={() => setViewMode("view")}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Mode
                          </Button>
                        )}
                        {viewMode === "remediate" && (
                          <Button variant="outline" size="sm" onClick={() => setViewMode("view")}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Mode
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Copy className="h-4 w-4 mr-2" />
                          Clone
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                {selectedItem ? (
                  <CardContent>
                    <ScrollArea className="h-[calc(100vh-24rem)]">
                      <div className="space-y-6">
                        {accessCategories.map((category, index) => (
                          <div key={index}>
                            <h3 className="font-medium mb-4">{category.name}</h3>
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[300px]">Permission</TableHead>
                                    <TableHead className="w-full">Description</TableHead>
                                    <TableHead className="w-[100px] text-center">Risk</TableHead>
                                    <TableHead className="w-[120px] text-center">Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {category.permissions.map((permission, permIndex) => (
                                    <TableRow key={permIndex}>
                                      <TableCell className="font-medium">{permission.name}</TableCell>
                                      <TableCell className="text-neutral-600">{permission.description}</TableCell>
                                      <TableCell className="text-center">
                                        <Badge className={getRiskColor(permission.risk)}>
                                          {permission.risk.charAt(0).toUpperCase() + permission.risk.slice(1)}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {viewMode === "view" ? (
                                          isPermissionEnabled(permission.name) ? (
                                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                              <CheckIcon className="h-3 w-3 mr-1" />
                                              Enabled
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-neutral-500 hover:bg-neutral-100">
                                              <XIcon className="h-3 w-3 mr-1" />
                                              Disabled
                                            </Badge>
                                          )
                                        ) : (
                                          <Switch 
                                            checked={isPermissionEnabled(permission.name)}
                                            onCheckedChange={() => handlePermissionToggle(permission.name)}
                                          />
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                ) : (
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <KeyRound className="h-12 w-12 text-neutral-300 mb-4" />
                      <h3 className="text-lg font-medium text-neutral-800 mb-2">No Access Control Selected</h3>
                      <p className="text-neutral-600 max-w-md">
                        Select a profile, permission set, or user from the left panel to view and manage access settings.
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Recommendations</CardTitle>
                  <CardDescription>
                    Actionable recommendations to improve your Salesforce security posture
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all">
                    <TabsList className="mb-6">
                      <TabsTrigger value="all">All Issues</TabsTrigger>
                      <TabsTrigger value="high" className="text-red-600">High Risk</TabsTrigger>
                      <TabsTrigger value="medium" className="text-yellow-600">Medium Risk</TabsTrigger>
                      <TabsTrigger value="low" className="text-green-600">Low Risk</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all">
                      <RecommendationTable recommendations={getFilteredRecommendations()} getIcon={getRecommendationIcon} getRiskColor={getRiskColor} />
                    </TabsContent>
                    
                    <TabsContent value="high">
                      <RecommendationTable recommendations={getFilteredRecommendations("high")} getIcon={getRecommendationIcon} getRiskColor={getRiskColor} />
                    </TabsContent>
                    
                    <TabsContent value="medium">
                      <RecommendationTable recommendations={getFilteredRecommendations("medium")} getIcon={getRecommendationIcon} getRiskColor={getRiskColor} />
                    </TabsContent>
                    
                    <TabsContent value="low">
                      <RecommendationTable recommendations={getFilteredRecommendations("low")} getIcon={getRecommendationIcon} getRiskColor={getRiskColor} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Access Control Audit</CardTitle>
                  <CardDescription>
                    Summary of high-risk access in your Salesforce organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">System Admin Users</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-3xl font-bold">3</div>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Review
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-600 mt-2">
                          3 users have System Administrator access
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Modify All Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-3xl font-bold">5</div>
                          <Badge className="bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            High Risk
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-600 mt-2">
                          5 users can modify all data
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">API Access</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="text-3xl font-bold">12</div>
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Review
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-600 mt-2">
                          12 users have API access enabled
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface RecommendationTableProps {
  recommendations: typeof securityRecommendations;
  getIcon: (type: string) => JSX.Element;
  getRiskColor: (risk: string) => string;
}

function RecommendationTable({ recommendations, getIcon, getRiskColor }: RecommendationTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Item</TableHead>
            <TableHead className="w-full">Issue Description</TableHead>
            <TableHead className="w-[250px]">Recommendation</TableHead>
            <TableHead className="w-[100px] text-center">Risk Level</TableHead>
            <TableHead className="w-[100px] text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recommendations.length > 0 ? (
            recommendations.map((rec) => (
              <TableRow key={rec.id}>
                <TableCell>
                  <div className="flex items-center">
                    {getIcon(rec.type)}
                    <span className="ml-2 font-medium">{rec.name}</span>
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}
                  </div>
                </TableCell>
                <TableCell>{rec.issue}</TableCell>
                <TableCell>{rec.recommendation}</TableCell>
                <TableCell className="text-center">
                  <Badge className={getRiskColor(rec.risk)}>
                    {rec.risk.charAt(0).toUpperCase() + rec.risk.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Button size="sm">Remediate</Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-neutral-500">
                No recommendations found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}