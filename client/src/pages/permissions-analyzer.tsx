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
  UploadCloud,
  Copy,
  CheckSquare,
  Database,
  Lock,
  Eye,
  CheckIcon,
  XIcon
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

// Mock permissions data
const mockPermissionsData = {
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

// Mock permission categories and specific permissions
const mockPermissionCategories = [
  {
    name: "Administrative Permissions",
    permissions: [
      { name: "Modify All Data", description: "Allows creating, editing, and deleting all data" },
      { name: "View All Data", description: "Allows viewing all data" },
      { name: "Manage Users", description: "Create and edit users" },
      { name: "Assign Permission Sets", description: "Assign permission sets to users" },
      { name: "Manage Profiles and Permission Sets", description: "Create and edit profiles and permission sets" },
    ]
  },
  {
    name: "General User Permissions",
    permissions: [
      { name: "API Enabled", description: "Access Salesforce through APIs" },
      { name: "Create Export Reports", description: "Create and export reports" },
      { name: "Edit Events", description: "Create and edit events" },
      { name: "Edit Tasks", description: "Create and edit tasks" },
      { name: "Run Reports", description: "Run reports" },
    ]
  },
  {
    name: "Data Permissions",
    permissions: [
      { name: "Export Reports", description: "Export report data" },
      { name: "Manage Dashboards", description: "Create, edit, and delete dashboards" },
      { name: "Manage Reports", description: "Create, edit, and delete reports" },
      { name: "View Dashboards", description: "View dashboards" },
      { name: "View Reports", description: "View reports" },
    ]
  },
  {
    name: "Object Permissions",
    permissions: [
      { name: "Account: Create", description: "Create accounts" },
      { name: "Account: Read", description: "View accounts" },
      { name: "Account: Edit", description: "Edit accounts" },
      { name: "Account: Delete", description: "Delete accounts" },
      { name: "Account: View All", description: "View all accounts" },
    ]
  },
];

// Sample current permissions for different items
const mockCurrentPermissions = {
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

// Types for permissions data
interface PermissionItem {
  id: number;
  name: string;
  description?: string; // Make description optional
  profile?: string;
  email?: string;
  isActive?: boolean;
}

interface PermissionCategory {
  name: string;
  permissions: {
    name: string;
    description: string;
  }[];
}

export default function PermissionsAnalyzer() {
  const { activeOrg } = useOrg();
  const [searchTerm, setSearchTerm] = useState("");
  const [permissionType, setPermissionType] = useState<"profiles" | "permissionSets" | "users">("profiles");
  const [selectedItem, setSelectedItem] = useState<PermissionItem | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "edit">("view");

  // Filter permission items based on search term
  const filteredItems = permissionType ? 
    mockPermissionsData[permissionType]
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) 
    : [];

  // Check if a permission is enabled for the selected item
  const isPermissionEnabled = (permissionName: string) => {
    if (!selectedItem) return false;
    
    return selectedItem.name in mockCurrentPermissions 
      ? mockCurrentPermissions[selectedItem.name as keyof typeof mockCurrentPermissions][permissionName as keyof typeof mockCurrentPermissions[keyof typeof mockCurrentPermissions]] || false
      : false;
  };

  // Handle permission toggle
  const handlePermissionToggle = (permissionName: string) => {
    // This would update the permission on the backend in a real implementation
    console.log(`Toggling ${permissionName} for ${selectedItem?.name}`);
  };

  // Get appropriate icon for permission type
  const getPermissionTypeIcon = (type: string) => {
    switch (type) {
      case "profiles":
        return <Shield className="h-4 w-4" />;
      case "permissionSets":
        return <CheckSquare className="h-4 w-4" />;
      case "users":
        return <User className="h-4 w-4" />;
      default:
        return <Lock className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800">Permissions Analyzer</h1>
            <p className="text-neutral-600">
              Analyze and manage user, profile, and permission set permissions.
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

        {!activeOrg && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No org selected</AlertTitle>
            <AlertDescription>
              Please select a Salesforce org to analyze permissions.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          {/* Left Panel - Permission Selection */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Select Target</CardTitle>
              <CardDescription>
                Choose a profile, permission set, or user to view permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="profiles" onValueChange={(value) => setPermissionType(value as "profiles" | "permissionSets" | "users")}>
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
                  placeholder={`Search ${permissionType}...`}
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <ScrollArea className="h-[calc(100vh-26rem)] rounded border">
                <div className="p-4">
                  <h3 className="font-medium text-sm mb-3">{permissionType.charAt(0).toUpperCase() + permissionType.slice(1)} ({filteredItems.length})</h3>
                  <ul className="space-y-2">
                    {filteredItems.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => setSelectedItem(item)}
                          className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-neutral-100 flex items-center justify-between ${selectedItem?.id === item.id ? 'bg-neutral-100 font-medium' : ''}`}
                        >
                          <div className="flex items-center">
                            {getPermissionTypeIcon(permissionType)}
                            <span className="ml-2 truncate">{item.name}</span>
                          </div>
                          {permissionType === "users" && 'isActive' in item && !item.isActive && (
                            <Badge variant="outline" className="bg-neutral-100 text-neutral-600">
                              Inactive
                            </Badge>
                          )}
                        </button>
                      </li>
                    ))}
                    {filteredItems.length === 0 && (
                      <li className="text-center text-sm text-neutral-500 py-4">
                        No {permissionType} found
                      </li>
                    )}
                  </ul>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* Right Panel - Permission Details */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>
                    {selectedItem ? selectedItem.name : "Permission Details"}
                  </CardTitle>
                  <CardDescription>
                    {selectedItem 
                      ? permissionType === "users" 
                        ? 'profile' in selectedItem ? `User profile: ${selectedItem.profile}` : ""
                        : selectedItem.description
                      : "Select a profile, permission set, or user to view permissions"}
                  </CardDescription>
                </div>
                
                {selectedItem && (
                  <div className="flex gap-2">
                    {viewMode === "view" ? (
                      <Button variant="outline" size="sm" onClick={() => setViewMode("edit")}>
                        <Lock className="h-4 w-4 mr-2" />
                        Edit Permissions
                      </Button>
                    ) : (
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
                <ScrollArea className="h-[calc(100vh-20rem)]">
                  <div className="space-y-6">
                    {mockPermissionCategories.map((category, index) => (
                      <div key={index}>
                        <h3 className="font-medium mb-4">{category.name}</h3>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[350px]">Permission</TableHead>
                                <TableHead className="w-full">Description</TableHead>
                                <TableHead className="w-[120px] text-center">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {category.permissions.map((permission, permIndex) => (
                                <TableRow key={permIndex}>
                                  <TableCell className="font-medium">{permission.name}</TableCell>
                                  <TableCell className="text-neutral-600">{permission.description}</TableCell>
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
                        {index < mockPermissionCategories.length - 1 && <Separator className="my-6" />}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            ) : (
              <CardContent className="text-center py-16">
                <div className="flex flex-col items-center justify-center">
                  <Shield className="h-16 w-16 text-neutral-300 mb-4" />
                  <h3 className="text-lg font-medium">No item selected</h3>
                  <p className="text-neutral-500 max-w-md mt-2">
                    Select a profile, permission set, or user from the left panel to view and manage permissions.
                  </p>
                </div>
              </CardContent>
            )}
            
            {selectedItem && viewMode === "edit" && (
              <CardFooter className="border-t py-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setViewMode("view")}>
                  Cancel
                </Button>
                <Button>
                  Save Changes
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}