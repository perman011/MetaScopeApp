import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Maximize2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SecurityAnalyzerProps {
  orgId: number;
}

export default function SecurityAnalyzer({ orgId }: SecurityAnalyzerProps) {
  const [selectedProfile, setSelectedProfile] = useState<string>("System Administrator");
  
  const { data: metadata, isLoading } = useQuery({
    queryKey: [`/api/orgs/${orgId}/metadata`, { type: "object" }],
    enabled: Boolean(orgId),
  });

  // Mock data for demonstration - in a real app, this would come from the API
  const profilePermissions = {
    "System Administrator": {
      objects: [
        { name: "Account", permissions: ["read", "create", "edit", "delete", "viewAll"] },
        { name: "Contact", permissions: ["read", "create", "edit", "delete", "viewAll"] },
        { name: "Opportunity", permissions: ["read", "create", "edit", "delete", "viewAll"] },
        { name: "Case", permissions: ["read", "create", "edit", "delete", "viewAll"] },
        { name: "Campaign", permissions: ["read", "create", "edit"] },
        { name: "Lead", permissions: ["read", "create", "edit", "delete", "viewAll"] },
        { name: "Custom__c", permissions: ["read"] },
      ]
    },
    "Standard User": {
      objects: [
        { name: "Account", permissions: ["read", "create", "edit"] },
        { name: "Contact", permissions: ["read", "create", "edit"] },
        { name: "Opportunity", permissions: ["read", "create", "edit"] },
        { name: "Case", permissions: ["read", "create"] },
        { name: "Campaign", permissions: ["read"] },
        { name: "Lead", permissions: ["read", "create", "edit"] },
        { name: "Custom__c", permissions: [] },
      ]
    },
    "Sales User": {
      objects: [
        { name: "Account", permissions: ["read", "create", "edit"] },
        { name: "Contact", permissions: ["read", "create", "edit"] },
        { name: "Opportunity", permissions: ["read", "create", "edit", "delete"] },
        { name: "Case", permissions: ["read"] },
        { name: "Campaign", permissions: ["read"] },
        { name: "Lead", permissions: ["read", "create", "edit", "delete"] },
        { name: "Custom__c", permissions: [] },
      ]
    },
    "Custom: Marketing": {
      objects: [
        { name: "Account", permissions: ["read"] },
        { name: "Contact", permissions: ["read"] },
        { name: "Opportunity", permissions: ["read"] },
        { name: "Case", permissions: [] },
        { name: "Campaign", permissions: ["read", "create", "edit", "delete"] },
        { name: "Lead", permissions: ["read", "create", "edit"] },
        { name: "Custom__c", permissions: ["read"] },
      ]
    }
  };

  const getAccessClass = (objectName: string, permission: string) => {
    // @ts-ignore - mock data structure
    const hasPermission = profilePermissions[selectedProfile]?.objects
      .find(obj => obj.name === objectName)
      ?.permissions.includes(permission);

    if (hasPermission) {
      return "bg-emerald-500 text-white";
    }
    return "bg-neutral-200 text-neutral-500";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-8 w-32" />
            </div>
            <Skeleton className="h-72 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="px-4 py-5 border-b border-neutral-200 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-base font-medium text-neutral-800">Security & Access Analysis</h3>
          <p className="mt-1 text-sm text-neutral-500">Profile and permission set overview</p>
        </div>
        <div className="flex space-x-2">
          <Select defaultValue={selectedProfile} onValueChange={setSelectedProfile}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select profile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="System Administrator">System Administrator</SelectItem>
              <SelectItem value="Standard User">Standard User</SelectItem>
              <SelectItem value="Sales User">Sales User</SelectItem>
              <SelectItem value="Custom: Marketing">Custom: Marketing</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" aria-label="Fullscreen">
            <Maximize2 className="h-5 w-5 text-primary-600" />
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="p-4 h-72">
          <div className="mb-3 flex justify-between items-center">
            <h4 className="text-sm font-medium text-neutral-700">
              Object Permissions ({selectedProfile})
            </h4>
            <div className="flex space-x-1 text-xs text-neutral-500">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded bg-emerald-500 mr-1"></div>
                <span>Full Access</span>
              </div>
              <div className="flex items-center ml-2">
                <div className="w-3 h-3 rounded bg-secondary-400 mr-1"></div>
                <span>Read/Write</span>
              </div>
              <div className="flex items-center ml-2">
                <div className="w-3 h-3 rounded bg-primary-300 mr-1"></div>
                <span>Read Only</span>
              </div>
              <div className="flex items-center ml-2">
                <div className="w-3 h-3 rounded bg-neutral-200 mr-1"></div>
                <span>No Access</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-6 gap-2 text-xs">
            {/* @ts-ignore - mock data structure */}
            {profilePermissions[selectedProfile]?.objects.map((object) => (
              <React.Fragment key={object.name}>
                <div className="font-medium text-right pt-2">{object.name}</div>
                <div className={`text-center py-2 rounded ${getAccessClass(object.name, "read")}`}>Read</div>
                <div className={`text-center py-2 rounded ${getAccessClass(object.name, "create")}`}>Create</div>
                <div className={`text-center py-2 rounded ${getAccessClass(object.name, "edit")}`}>Edit</div>
                <div className={`text-center py-2 rounded ${getAccessClass(object.name, "delete")}`}>Delete</div>
                <div className={`text-center py-2 rounded ${getAccessClass(object.name, "viewAll")}`}>View All</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-neutral-50 px-4 py-3 sm:px-6 flex justify-between">
        <a href="#" className="text-sm text-primary-600 hover:text-primary-500">View full security analysis</a>
        <div className="text-sm text-neutral-500">
          <span className="font-medium">8</span> profiles, 
          <span className="font-medium"> 14</span> permission sets
        </div>
      </div>
    </Card>
  );
}
