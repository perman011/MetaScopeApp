import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import Footer from "@/components/layout/footer";
import OrgContext from "@/components/org-context";
import FilterBar from "@/components/filter-bar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SalesforceOrg } from "@shared/schema";
import { Loader2, ExternalLink, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Import D3.js for the visualization
import * as d3 from "d3";
import { useRef } from "react";

export default function DataModelPage() {
  const [location, setLocation] = useLocation();
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [view, setView] = useState("graph");
  const svgRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();

  const { data: orgs, isLoading } = useQuery<SalesforceOrg[]>({
    queryKey: ["/api/orgs"],
  });

  const { data: metadata, isLoading: isMetadataLoading } = useQuery({
    queryKey: [`/api/orgs/${selectedOrgId}/metadata`, { type: "object" }],
    enabled: Boolean(selectedOrgId),
  });

  // Extract org ID from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const orgId = params.get("org");
    if (orgId) {
      setSelectedOrgId(parseInt(orgId));
    }
  }, [location]);

  // Set the first org as selected if none is selected and orgs are loaded
  useEffect(() => {
    if (!selectedOrgId && orgs && orgs.length > 0) {
      const activeOrg = orgs.find(org => org.isActive) || orgs[0];
      setSelectedOrgId(activeOrg.id);
    } else if (orgs && orgs.length === 0) {
      // Redirect to organizations page if no orgs are connected
      setLocation("/organizations?action=connect");
    }
  }, [orgs, selectedOrgId, setLocation]);

  useEffect(() => {
    if (!metadata || !svgRef.current) return;
    
    // D3 visualization code would go here
    // This is a simplified example to show the structure
    const svg = d3.select(svgRef.current);
    const width = 1000;
    const height = 600;
    
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    
    // Clear existing elements
    svg.selectAll("*").remove();
    
    // Create some mock data for the visualization
    const nodes = [
      { id: "Account", type: "standard-primary", x: 400, y: 300, radius: 40 },
      { id: "Contact", type: "standard", x: 600, y: 200, radius: 35 },
      { id: "Opportunity", type: "standard", x: 600, y: 400, radius: 35 },
      { id: "Case", type: "standard", x: 200, y: 200, radius: 35 },
      { id: "Lead", type: "standard", x: 200, y: 400, radius: 35 },
      { id: "Campaign", type: "standard", x: 300, y: 100, radius: 35 },
      { id: "Custom__c", type: "custom", x: 500, y: 100, radius: 35 },
      { id: "Product2", type: "standard", x: 700, y: 100, radius: 35 },
      { id: "PricebookEntry", type: "standard", x: 700, y: 300, radius: 35 },
      { id: "Quote", type: "standard", x: 700, y: 500, radius: 35 },
      { id: "Order", type: "standard", x: 500, y: 500, radius: 35 },
      { id: "Contract", type: "standard", x: 300, y: 500, radius: 35 },
    ];
    
    const links = [
      { source: "Account", target: "Contact", weight: 2 },
      { source: "Account", target: "Opportunity", weight: 2 },
      { source: "Account", target: "Case", weight: 2 },
      { source: "Contact", target: "Case", weight: 1 },
      { source: "Lead", target: "Account", weight: 1 },
      { source: "Lead", target: "Contact", weight: 1 },
      { source: "Lead", target: "Opportunity", weight: 1 },
      { source: "Campaign", target: "Lead", weight: 1 },
      { source: "Opportunity", target: "Product2", weight: 1 },
      { source: "Product2", target: "PricebookEntry", weight: 1 },
      { source: "Opportunity", target: "Quote", weight: 1 },
      { source: "Quote", target: "Order", weight: 1 },
      { source: "Account", target: "Contract", weight: 1 },
      { source: "Order", target: "Contract", weight: 1 },
      { source: "Campaign", target: "Custom__c", weight: 1 },
    ];
    
    // Draw links
    svg.selectAll(".link")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("x1", d => {
        const source = nodes.find(node => node.id === d.source);
        return source ? source.x : 0;
      })
      .attr("y1", d => {
        const source = nodes.find(node => node.id === d.source);
        return source ? source.y : 0;
      })
      .attr("x2", d => {
        const target = nodes.find(node => node.id === d.target);
        return target ? target.x : 0;
      })
      .attr("y2", d => {
        const target = nodes.find(node => node.id === d.target);
        return target ? target.y : 0;
      })
      .attr("stroke", "#6b7280")
      .attr("stroke-width", d => d.weight);
    
    // Draw nodes
    const nodeGroups = svg.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.x}, ${d.y})`);
    
    nodeGroups.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => {
        if (d.type === "standard-primary") return "#0073b6";
        if (d.type === "standard") return "#00afb2";
        return "#ef4444";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);
    
    nodeGroups.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", 12)
      .text(d => d.id);
    
    // Add legend
    const legend = svg.append("g")
      .attr("transform", "translate(50, 550)");
    
    const legendItems = [
      { label: "Standard (Primary)", color: "#0073b6" },
      { label: "Standard", color: "#00afb2", x: 160 },
      { label: "Custom", color: "#ef4444", x: 270 }
    ];
    
    legendItems.forEach(item => {
      const g = legend.append("g")
        .attr("transform", `translate(${item.x || 0}, 0)`);
      
      g.append("circle")
        .attr("r", 8)
        .attr("fill", item.color);
      
      g.append("text")
        .attr("x", 15)
        .attr("y", 4)
        .attr("text-anchor", "start")
        .attr("fill", "#374151")
        .attr("font-size", 12)
        .text(item.label);
    });
    
  }, [metadata, view]);

  const handleOrgChange = (orgId: number) => {
    setSelectedOrgId(orgId);
    setLocation(`/data-model?org=${orgId}`);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    toast({
      title: "Search applied",
      description: `Filtering for "${term}"`,
    });
  };

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type);
    toast({
      title: "Type filter applied",
      description: `Showing ${type === 'all' ? 'all types' : type}`,
    });
  };

  const handleProfileFilter = (profile: string) => {
    toast({
      title: "Profile filter not applicable",
      description: "Profile filtering is only used in security analysis view",
    });
  };

  const handleExportDiagram = () => {
    if (!svgRef.current) return;
    
    // Create a serialized SVG
    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(svgRef.current);
    
    // Create a Blob and download link
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'data-model-diagram.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    toast({
      title: "Diagram exported",
      description: "The SVG diagram has been downloaded",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary-500 mb-4" />
              <p className="text-neutral-500">Loading organizations...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 lg:p-6">
          {selectedOrgId && (
            <>
              <OrgContext orgId={selectedOrgId} onOrgChange={handleOrgChange} />
              
              <FilterBar 
                onSearch={handleSearch}
                onTypeFilter={handleTypeFilter}
                onProfileFilter={handleProfileFilter}
              />
              
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>Data Model Explorer</CardTitle>
                    <CardDescription>Visualize object relationships and dependencies</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleExportDiagram}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Diagram
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Full Screen
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="graph" value={view} onValueChange={setView} className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="graph">Graph View</TabsTrigger>
                      <TabsTrigger value="erd">ERD View</TabsTrigger>
                      <TabsTrigger value="hierarchy">Hierarchy View</TabsTrigger>
                      <TabsTrigger value="details">Details View</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="graph" className="mt-0">
                      <div className="border border-neutral-200 rounded-md bg-white">
                        {isMetadataLoading ? (
                          <div className="h-[600px] flex items-center justify-center">
                            <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
                          </div>
                        ) : (
                          <svg 
                            ref={svgRef}
                            width="100%" 
                            height="600" 
                            className="bg-white"
                          />
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="erd" className="mt-0">
                      <div className="h-[600px] flex items-center justify-center border border-neutral-200 rounded-md bg-white">
                        <div className="text-neutral-500">
                          <p>Entity Relationship Diagram view is coming soon</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="hierarchy" className="mt-0">
                      <div className="h-[600px] flex items-center justify-center border border-neutral-200 rounded-md bg-white">
                        <div className="text-neutral-500">
                          <p>Hierarchy view is coming soon</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="details" className="mt-0">
                      <div className="h-[600px] flex items-center justify-center border border-neutral-200 rounded-md bg-white">
                        <div className="text-neutral-500">
                          <p>Details view is coming soon</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
}
