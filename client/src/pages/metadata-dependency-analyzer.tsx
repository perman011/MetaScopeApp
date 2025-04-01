import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import TopNavBar from "@/components/layout/top-nav-bar";
import SideNavigation from "@/components/layout/side-navigation";
import { useOrgContext } from "@/hooks/use-org";
import { useToast } from "@/hooks/use-toast";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Layers, 
  Link2, 
  AlertCircle, 
  HelpCircle,
  DownloadCloud,
  Eye,
  Code,
  Database,
  ArrowDownUp,
  Loader2
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

// Interface for the dependency reference types
interface DependencyReference {
  id: number;
  name: string;
  type: string;
  referenceType: string;
}

interface MetadataItem {
  id: number;
  name: string;
  type: string;
  references: DependencyReference[];
}

export default function MetadataDependencyAnalyzer() {
  const { activeOrg } = useOrgContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMetadataType, setSelectedMetadataType] = useState<string>("apex");
  const [selectedMetadataItem, setSelectedMetadataItem] = useState<MetadataItem | null>(null);
  const [viewMode, setViewMode] = useState<"dependencies" | "reverseDependencies">("dependencies");
  const { toast } = useToast();

  const metadataTypeOptions = [
    { value: "apex", label: "Apex Classes & Triggers" },
    { value: "fields", label: "Custom Fields" },
    { value: "objects", label: "Custom Objects" },
  ];
  
  // Fetch metadata dependencies from API
  const { 
    data: metadataDependencies, 
    isLoading: isDependenciesLoading, 
    error: dependenciesError 
  } = useQuery({
    queryKey: [`/api/orgs/${activeOrg?.id}/metadata/dependencies`],
    enabled: !!activeOrg?.id,
  });
  
  // Fetch reverse dependencies for selected item
  const { 
    data: reverseDependencies, 
    isLoading: isReverseDependenciesLoading 
  } = useQuery({
    queryKey: [`/api/orgs/${activeOrg?.id}/metadata/dependencies/reverse`, selectedMetadataItem?.name],
    enabled: !!activeOrg?.id && !!selectedMetadataItem?.name,
  });
  
  // Show error toast if there's an error
  useEffect(() => {
    if (dependenciesError) {
      toast({
        title: "Error loading dependencies",
        description: "Could not load metadata dependencies. Please try again.",
        variant: "destructive",
      });
    }
  }, [dependenciesError, toast]);

  // Filter metadata based on search term and real API data
  const filteredMetadata = selectedMetadataType && metadataDependencies 
    ? (metadataDependencies[selectedMetadataType as keyof typeof metadataDependencies] || [])
        .filter((item: MetadataItem) => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        ) 
    : [];

  // Handle the view details click
  const handleViewDetails = (item: MetadataItem) => {
    setSelectedMetadataItem(item);
  };

  // Get appropriate icon for metadata type
  const getMetadataTypeIcon = (type: string) => {
    switch (type) {
      case "ApexClass":
        return <Code className="h-4 w-4" />;
      case "ApexTrigger":
        return <Code className="h-4 w-4" />;
      case "CustomObject":
        return <Database className="h-4 w-4" />;
      case "CustomField":
        return <Database className="h-4 w-4" />;
      case "Flow":
        return <ArrowDownUp className="h-4 w-4" />;
      default:
        return <Layers className="h-4 w-4" />;
    }
  };

  // Get badge color based on reference type
  const getReferenceBadgeColor = (type: string) => {
    switch (type) {
      case "Method Call":
        return "bg-blue-100 text-blue-800";
      case "Class Reference":
        return "bg-indigo-100 text-indigo-800";
      case "Trigger Handler":
        return "bg-purple-100 text-purple-800";
      case "Field Reference":
        return "bg-green-100 text-green-800";
      case "Object Reference":
        return "bg-amber-100 text-amber-800";
      case "Layout Field":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <TopNavBar />
      <div className="flex flex-1 overflow-hidden">
        <SideNavigation />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-neutral-800">Metadata Dependency Analyzer</h1>
                <p className="text-neutral-600">
                  Analyze dependencies and references between metadata components.
                </p>
              </div>
              <div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <HelpCircle className="h-4 w-4 mr-2" />
                      How it works
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Understanding Metadata Dependencies</DialogTitle>
                      <DialogDescription>
                        The Metadata Dependency Analyzer helps you identify relationships between components in your Salesforce org.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <h4 className="font-medium">What are dependencies?</h4>
                      <p className="text-sm text-neutral-600">
                        Dependencies show which components reference or depend on a particular metadata item. 
                        For example, an Apex class might be referenced by triggers, flows, or other classes.
                      </p>
                      
                      <h4 className="font-medium">How to use this tool</h4>
                      <ol className="text-sm text-neutral-600 space-y-2 ml-4 list-decimal">
                        <li>Select a metadata type (Apex, Fields, Objects)</li>
                        <li>Find the specific component you want to analyze</li>
                        <li>View all components that reference or depend on it</li>
                        <li>Switch between "References to" and "Referenced by" views</li>
                      </ol>
                      
                      <h4 className="font-medium">Benefits</h4>
                      <ul className="text-sm text-neutral-600 space-y-2 ml-4 list-disc">
                        <li>Identify impact before making changes</li>
                        <li>Debug complex interactions between components</li>
                        <li>Improve refactoring and code maintenance</li>
                        <li>Document dependencies for better understanding</li>
                      </ul>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {!activeOrg && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No org selected</AlertTitle>
                <AlertDescription>
                  Please select a Salesforce org to analyze metadata dependencies.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
              {/* Left Panel - Metadata Selection */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Select Metadata</CardTitle>
                  <CardDescription>
                    Choose a metadata type and search for specific components
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Metadata Type</label>
                    <Select 
                      value={selectedMetadataType} 
                      onValueChange={setSelectedMetadataType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select metadata type" />
                      </SelectTrigger>
                      <SelectContent>
                        {metadataTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search components..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <ScrollArea className="h-[calc(100vh-26rem)] rounded border">
                    <div className="p-4">
                      <h3 className="font-medium text-sm mb-3">Components ({filteredMetadata.length})</h3>
                      <ul className="space-y-2">
                        {filteredMetadata.map((item: MetadataItem) => (
                          <li key={item.id}>
                            <button
                              onClick={() => handleViewDetails(item)}
                              className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-neutral-100 flex items-center justify-between ${selectedMetadataItem?.id === item.id ? 'bg-neutral-100 font-medium' : ''}`}
                            >
                              <div className="flex items-center">
                                {getMetadataTypeIcon(item.type)}
                                <span className="ml-2">{item.name}</span>
                              </div>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {item.references.length}
                              </Badge>
                            </button>
                          </li>
                        ))}
                        {filteredMetadata.length === 0 && (
                          <li className="text-center text-sm text-neutral-500 py-4">
                            No components found
                          </li>
                        )}
                      </ul>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
              
              {/* Right Panel - Dependency Details */}
              <Card className="lg:col-span-5">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>
                        {selectedMetadataItem ? selectedMetadataItem.name : "Dependency Details"}
                      </CardTitle>
                      <CardDescription>
                        {selectedMetadataItem 
                          ? `Viewing dependencies for ${selectedMetadataItem.type}`
                          : "Select a component to view its dependencies"}
                      </CardDescription>
                    </div>
                    
                    {selectedMetadataItem && (
                      <Button variant="outline" size="sm">
                        <DownloadCloud className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    )}
                  </div>
                </CardHeader>
                
                {selectedMetadataItem ? (
                  <>
                    <CardContent>
                      <Tabs defaultValue="dependencies" onValueChange={(val) => setViewMode(val as "dependencies" | "reverseDependencies")}>
                        <TabsList className="mb-4">
                          <TabsTrigger value="dependencies" className="flex items-center">
                            <Link2 className="h-4 w-4 mr-2" />
                            Referenced By
                          </TabsTrigger>
                          <TabsTrigger value="reverseDependencies" className="flex items-center">
                            <Link2 className="h-4 w-4 mr-2 rotate-180" />
                            References To
                          </TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="dependencies" className="mt-0">
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[250px]">Component</TableHead>
                                  <TableHead className="w-[150px]">Type</TableHead>
                                  <TableHead>Reference Type</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedMetadataItem.references.map((reference) => (
                                  <TableRow key={reference.id}>
                                    <TableCell className="font-medium flex items-center">
                                      {getMetadataTypeIcon(reference.type)}
                                      <span className="ml-2">{reference.name}</span>
                                    </TableCell>
                                    <TableCell>{reference.type}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={getReferenceBadgeColor(reference.referenceType)}>
                                        {reference.referenceType}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="sm">
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                                {selectedMetadataItem.references.length === 0 && (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center text-neutral-500 py-8">
                                      No references found for this component
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="reverseDependencies" className="mt-0">
                          <div className="rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[250px]">Component</TableHead>
                                  <TableHead className="w-[150px]">Type</TableHead>
                                  <TableHead>Reference Type</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {isReverseDependenciesLoading ? (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8">
                                      <div className="flex justify-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                      </div>
                                      <p className="text-sm text-neutral-500 mt-2">Loading dependencies...</p>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  <>
                                    {Array.isArray(reverseDependencies) && reverseDependencies.map((reference: any, index: number) => (
                                      <TableRow key={index}>
                                        <TableCell className="font-medium flex items-center">
                                          {getMetadataTypeIcon(reference.type)}
                                          <span className="ml-2">{reference.name}</span>
                                        </TableCell>
                                        <TableCell>{reference.type}</TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className={getReferenceBadgeColor(reference.referenceType)}>
                                            {reference.referenceType}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <Button variant="ghost" size="sm">
                                            <Eye className="h-4 w-4 mr-1" />
                                            View
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                    {(!reverseDependencies || !Array.isArray(reverseDependencies) || reverseDependencies.length === 0) && (
                                      <TableRow>
                                        <TableCell colSpan={4} className="text-center text-neutral-500 py-8">
                                          No dependencies found for this component
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                    <CardFooter className="bg-neutral-50 border-t py-4 text-sm">
                      <div className="flex items-center text-neutral-600">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Dependencies are calculated based on static and dynamic analysis of components.
                      </div>
                    </CardFooter>
                  </>
                ) : (
                  <CardContent className="text-center py-16">
                    <div className="flex flex-col items-center justify-center">
                      <Link2 className="h-16 w-16 text-neutral-300 mb-4" />
                      <h3 className="text-lg font-medium">No component selected</h3>
                      <p className="text-neutral-500 max-w-md mt-2">
                        Select a component from the left panel to view its dependencies and references.
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}