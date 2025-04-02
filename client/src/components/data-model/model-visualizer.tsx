import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import cytoscape from 'cytoscape';

interface ModelVisualizerProps {
  metadata: any;
  selectedLayout?: string; // Optional prop to receive layout from parent
}

export default function ModelVisualizer({ metadata, selectedLayout = 'force-directed' }: ModelVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [layout, setLayout] = useState(selectedLayout);
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  
  // D3-based force-directed graph visualization
  const renderD3Visualization = () => {
    if (!metadata || !svgRef.current) return;
    
    // Clear previous visualization
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Extract objects and relationships from metadata
    const objects = metadata.objects || [];
    
    // Create nodes and links for the force-directed graph
    const nodes = objects.map(obj => ({
      id: obj.name,
      label: obj.label || obj.name,
      type: "object",
      isCustom: obj.name.includes('__c'),
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
            type: rel.type || 'Lookup'
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
    const color = (d: any) => {
      return d.isCustom ? "#ff9e2c" : "#0176d3";
    };
    
    // Define color and width for links based on relationship type
    const linkColor = (type: string) => {
      const lowerType = type.toLowerCase();
      if (lowerType.includes('master')) return "#ea8c55"; // Master-Detail
      if (lowerType.includes('self')) return "#8a49a8"; // Self-Join
      if (lowerType.includes('many')) return "#3EB489"; // Many-to-Many
      return "#5a7d9a"; // Default (Lookup)
    };
    
    const linkWidth = (type: string) => {
      return type.toLowerCase().includes('master') ? 2.5 : 1.5;
    };
    
    // Create the links
    const link = svg.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", (d) => linkColor(d.type))
      .attr("stroke-width", (d) => linkWidth(d.type));
    
    // Create the nodes
    const node = svg.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(nodes)
      .enter().append("g");
    
    // Add rectangle nodes with rounded corners (matching enhanced visualizer)
    node.append("rect")
      .attr("width", 80)
      .attr("height", 80)
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("x", -40)
      .attr("y", -40)
      .attr("fill", (d: any) => color(d))
      .attr("opacity", 0.9)
      .call(d3.drag<SVGRectElement, any>()
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
      .attr("font-size", "11px")
      .style("text-wrap", "wrap")
      .call(wrap, 70); // Wrap text at 70px width
    
    // Function to wrap text
    function wrap(text: d3.Selection<SVGTextElement, any, any, any>, width: number) {
      text.each(function() {
        const text = d3.select(this);
        const words = text.text().split(/\s+/).reverse();
        let word: string | undefined;
        let line: string[] = [];
        let lineNumber = 0;
        const lineHeight = 1.1; // ems
        const y = text.attr("y");
        const dy = parseFloat(text.attr("dy") || "0");
        
        let tspan = text.text(null).append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", dy + "em");
        
        while (word = words.pop()) {
          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node()!.getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan")
              .attr("x", 0)
              .attr("y", y)
              .attr("dy", ++lineNumber * lineHeight + dy + "em")
              .text(word);
          }
        }
      });
    }
    
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
  };
  
  useEffect(() => {
    // Only render if we have metadata
    if (!metadata) return;
    
    // Use D3 for visualization
    renderD3Visualization();
    
    // Cleanup function
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [metadata, layout]);
  
  return (
    <div className="w-full h-full" ref={containerRef}>
      <svg ref={svgRef} width="100%" height="100%" className="overflow-visible" />
    </div>
  );
}
