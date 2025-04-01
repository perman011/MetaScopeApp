import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Maximize2, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import * as d3 from "d3";

interface DataModelAnalyzerProps {
  orgId: number;
}

export default function DataModelAnalyzer({ orgId }: DataModelAnalyzerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [zoom, setZoom] = useState(1);
  
  const { data: metadata, isLoading } = useQuery({
    queryKey: [`/api/orgs/${orgId}/metadata`, { type: "object" }],
    enabled: Boolean(orgId),
  });

  useEffect(() => {
    if (!metadata || !svgRef.current) return;
    
    // D3 visualization code would go here
    // This is a simplified example to show the structure
    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 300;
    
    svg.attr("viewBox", `0 0 ${width} ${height}`);
    
    // Clear existing elements
    svg.selectAll("*").remove();
    
    // Create some mock data for the visualization
    const nodes = [
      { id: "Account", type: "standard-primary", x: 400, y: 150, radius: 40 },
      { id: "Contact", type: "standard", x: 550, y: 100, radius: 35 },
      { id: "Opportunity", type: "standard", x: 550, y: 200, radius: 35 },
      { id: "Case", type: "standard", x: 250, y: 100, radius: 35 },
      { id: "Custom__c", type: "custom", x: 250, y: 200, radius: 35 },
    ];
    
    const links = [
      { source: "Account", target: "Contact", weight: 2 },
      { source: "Account", target: "Opportunity", weight: 2 },
      { source: "Account", target: "Case", weight: 2 },
      { source: "Account", target: "Custom__c", weight: 2 },
    ];
    
    // Draw links
    svg.selectAll(".link")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("x1", d => {
        const source = nodes.find(node => node.id === d.source);
        return source ? source.x + 30 : 0;
      })
      .attr("y1", d => {
        const source = nodes.find(node => node.id === d.source);
        return source ? source.y + (d.target === "Contact" || d.target === "Case" ? -20 : 20) : 0;
      })
      .attr("x2", d => {
        const target = nodes.find(node => node.id === d.target);
        return target ? target.x - 30 : 0;
      })
      .attr("y2", d => {
        const target = nodes.find(node => node.id === d.target);
        return target ? target.y + (d.target === "Contact" || d.target === "Case" ? 10 : -10) : 0;
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
      });
    
    nodeGroups.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", 12)
      .text(d => d.id);
    
    // Add legend
    const legend = svg.append("g")
      .attr("transform", "translate(50, 270)");
    
    const legendItems = [
      { label: "Standard (Primary)", color: "#0073b6" },
      { label: "Standard", color: "#00afb2", x: 150 },
      { label: "Custom", color: "#ef4444", x: 250 }
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
    
  }, [metadata]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-6" />
            </div>
            <Skeleton className="h-80 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="px-4 py-5 border-b border-neutral-200 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-base font-medium text-neutral-800">Data Model Overview</h3>
          <p className="mt-1 text-sm text-neutral-500">Visual representation of object relationships</p>
        </div>
        <div>
          <Button variant="ghost" size="icon" aria-label="Fullscreen">
            <Maximize2 className="h-5 w-5 text-primary-600" />
          </Button>
        </div>
      </div>
      <div className="p-4 h-80 relative">
        <svg 
          ref={svgRef} 
          width="100%" 
          height="100%" 
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
        />
        
        <div className="absolute bottom-4 right-4 flex space-x-2">
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleReset}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="bg-neutral-50 px-4 py-3 sm:px-6 flex justify-between">
        <a href="#" className="text-sm text-primary-600 hover:text-primary-500">View full data model</a>
        <div className="text-sm text-neutral-500">
          <span className="font-medium">{metadata?.length || 0}</span> objects, 
          <span className="font-medium"> {metadata?.reduce((acc, obj) => acc + (obj.data.fields?.length || 0), 0) || 0}</span> fields
        </div>
      </div>
    </Card>
  );
}
