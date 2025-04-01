import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface ModelVisualizerProps {
  metadata: any;
}

export default function ModelVisualizer({ metadata }: ModelVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  useEffect(() => {
    if (!metadata || !svgRef.current) return;
    
    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Extract objects and relationships from metadata
    const objects = metadata.objects || [];
    
    // Create nodes and links for the force-directed graph
    const nodes = objects.map(obj => ({
      id: obj.name,
      label: obj.name,
      type: "object",
      size: obj.fields?.length || 5,
    }));
    
    // Create links from relationships
    const links: { source: string; target: string; type: string }[] = [];
    
    objects.forEach(obj => {
      (obj.relationships || []).forEach(rel => {
        // Only add the link if both objects exist
        if (nodes.some(n => n.id === rel.object)) {
          links.push({
            source: obj.name,
            target: rel.object,
            type: rel.type
          });
        }
      });
    });
    
    // Set up the SVG container
    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    // Create a force simulation
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius((d: any) => d.size * 4 + 10));
    
    // Define color scale for nodes
    const color = (type: string) => {
      if (type === "object") return "#0061D5";
      return "#6C63FF";
    };
    
    // Create the links
    const link = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#718096")
      .attr("stroke-width", 1.5);
    
    // Create the nodes
    const node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter().append("g");
    
    // Add circles to nodes
    node.append("circle")
      .attr("r", (d: any) => Math.max(d.size * 2, 20))
      .attr("fill", (d: any) => color(d.type))
      .attr("opacity", 0.9)
      .call(d3.drag<SVGCircleElement, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    // Add labels to nodes
    node.append("text")
      .text((d: any) => d.label)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("fill", "white")
      .attr("font-weight", "bold")
      .attr("font-size", (d: any) => Math.min(d.size * 0.8, 14));
    
    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });
    
    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Cleanup when component unmounts
    return () => {
      simulation.stop();
    };
  }, [metadata]);
  
  return (
    <svg ref={svgRef} width="100%" height="100%" className="overflow-visible" />
  );
}
