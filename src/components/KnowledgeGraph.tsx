import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import { Info, Maximize2, Minimize2, RefreshCw, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: string;
  label: string;
  description: string;
  radius: number;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  value: number;
  effect: string;
}

const DATA: { nodes: Node[], links: Link[] } = {
  nodes: [
    { id: 'sleep', group: 'rest', label: 'Sleep Architecture', description: 'Circadian rhythms, REM/Deep sleep cycles, and glymphatic clearance.', radius: 45 },
    { id: 'gut', group: 'digestion', label: 'Gut Microbiome', description: 'Trillions of microbes influencing immunity, mood, and nutrient synthesis.', radius: 40 },
    { id: 'brain', group: 'cognition', label: 'Cognitive Function', description: 'Neuroplasticity, executive function, and emotional regulation.', radius: 42 },
    { id: 'immune', group: 'defense', label: 'Immune System', description: 'Innate and adaptive responses, inflammation control, and cellular defense.', radius: 38 },
    { id: 'hormones', group: 'endocrine', label: 'Endocrine System', description: 'Hormonal signaling (Cortisol, Insulin, Testosterone, Estrogen).', radius: 36 },
    { id: 'metabolism', group: 'energy', label: 'Metabolism', description: 'Mitochondrial health, glucose regulation, and energy production.', radius: 38 },
    { id: 'muscle', group: 'physical', label: 'Musculoskeletal', description: 'Muscle protein synthesis, bone density, and physical performance.', radius: 35 },
    { id: 'heart', group: 'cardio', label: 'Cardiovascular', description: 'Heart rate variability, blood pressure, and oxygen delivery.', radius: 37 },
    { id: 'skin', group: 'barrier', label: 'Dermal Barrier', description: 'Skin integrity, collagen production, and external protection.', radius: 32 },
    { id: 'liver', group: 'detox', label: 'Hepatic Function', description: 'Detoxification, bile production, and metabolic filtering.', radius: 34 },
  ],
  links: [
    { source: 'sleep', target: 'brain', value: 3, effect: 'Glymphatic clearance & memory consolidation' },
    { source: 'sleep', target: 'immune', value: 2, effect: 'Cytokine production & T-cell regulation' },
    { source: 'sleep', target: 'gut', value: 2, effect: 'Microbiome circadian rhythmicity' },
    { source: 'gut', target: 'brain', value: 4, effect: 'Gut-Brain Axis: 95% of Serotonin produced in gut' },
    { source: 'gut', target: 'immune', value: 3, effect: '70% of immune cells reside in GALT' },
    { source: 'gut', target: 'liver', value: 2, effect: 'Enterohepatic circulation & toxin filtering' },
    { source: 'brain', target: 'hormones', value: 3, effect: 'HPA Axis: Stress response regulation' },
    { source: 'hormones', target: 'metabolism', value: 4, effect: 'Insulin & Thyroid metabolic control' },
    { source: 'metabolism', target: 'muscle', value: 3, effect: 'ATP supply & glycogen storage' },
    { source: 'immune', target: 'skin', value: 2, effect: 'Inflammatory response & wound healing' },
    { source: 'heart', target: 'brain', value: 3, effect: 'Cerebral blood flow & oxygenation' },
    { source: 'heart', target: 'metabolism', value: 2, effect: 'Lipid transport & systemic circulation' },
    { source: 'muscle', target: 'hormones', value: 2, effect: 'Myokine release & insulin sensitivity' },
    { source: 'liver', target: 'metabolism', value: 3, effect: 'Glucose homeostasis & lipid processing' },
    { source: 'brain', target: 'sleep', value: 2, effect: 'Adenosine buildup & sleep pressure' },
    { source: 'metabolism', target: 'sleep', value: 2, effect: 'Melatonin precursor synthesis' },
  ]
};

const COLORS: Record<string, string> = {
  rest: '#818cf8',
  digestion: '#fbbf24',
  cognition: '#f472b6',
  defense: '#4ade80',
  endocrine: '#a78bfa',
  energy: '#fb7185',
  physical: '#38bdf8',
  cardio: '#f87171',
  barrier: '#fb923c',
  detox: '#2dd4bf',
};

interface KnowledgeGraphProps {
  onJumpToAtlas?: (systemId: string) => void;
}

export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ onJumpToAtlas }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hoveredLink, setHoveredLink] = useState<Link | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleAtlasJump = () => {
    if (selectedNode && onJumpToAtlas) {
      onJumpToAtlas(selectedNode.id);
    }
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 600;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Simulation setup
    const simulation = d3.forceSimulation<Node>(DATA.nodes)
      .force("link", d3.forceLink<Node, Link>(DATA.links).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-800))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => (d as Node).radius + 20));

    // Arrow markers
    svg.append("defs").selectAll("marker")
      .data(["end"])
      .enter().append("marker")
      .attr("id", d => d)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 30)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#141414")
      .attr("opacity", 0.3);

    // Links
    const link = g.append("g")
      .selectAll("line")
      .data(DATA.links)
      .enter().append("line")
      .attr("stroke", "#141414")
      .attr("stroke-opacity", 0.15)
      .attr("stroke-width", d => Math.sqrt(d.value) * 2)
      .attr("marker-end", "url(#end)")
      .on("mouseenter", (event, d) => setHoveredLink(d))
      .on("mouseleave", () => setHoveredLink(null));

    // Nodes
    const node = g.append("g")
      .selectAll("g")
      .data(DATA.nodes)
      .enter().append("g")
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("click", (event, d) => setSelectedNode(d));

    node.append("circle")
      .attr("r", d => d.radius)
      .attr("fill", d => COLORS[d.group])
      .attr("stroke", "#141414")
      .attr("stroke-width", 2)
      .attr("class", "cursor-pointer transition-all duration-300 hover:brightness-90");

    node.append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("font-family", "monospace")
      .attr("text-transform", "uppercase")
      .attr("pointer-events", "none")
      .text(d => d.id);

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Node).x!)
        .attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!)
        .attr("y2", d => (d.target as Node).y!);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [isFullscreen]);

  return (
    <div className={cn(
      "relative bg-[#E4E3E0] border border-[#141414] overflow-hidden transition-all duration-500",
      isFullscreen ? "fixed inset-0 z-[100] m-0" : "h-[700px] w-full"
    )} ref={containerRef}>
      {/* UI Overlay */}
      <div className="absolute top-6 left-6 z-10 pointer-events-none">
        <h2 className="text-4xl font-serif italic leading-none mb-2">Biological Knowledge Graph</h2>
        <p className="text-[10px] font-mono uppercase tracking-widest opacity-50">Interactive System Interconnectivity v1.0</p>
      </div>

      <div className="absolute top-6 right-6 z-10 flex gap-2">
        <button 
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2 bg-[#141414] text-[#E4E3E0] hover:bg-opacity-90 transition-all"
          title={isFullscreen ? "Minimize" : "Maximize"}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="p-2 bg-[#141414] text-[#E4E3E0] hover:bg-opacity-90 transition-all"
          title="Reset Graph"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Info Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute right-6 top-20 bottom-6 w-80 bg-[#141414] text-[#E4E3E0] p-8 overflow-y-auto z-20 shadow-2xl border border-[#E4E3E0]/10"
          >
            <button 
              onClick={() => setSelectedNode(null)}
              className="absolute top-4 right-4 text-[10px] font-mono uppercase opacity-50 hover:opacity-100"
            >
              Close
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[selectedNode.group] }} />
              <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">{selectedNode.group}</span>
            </div>
            <h3 className="text-3xl font-serif italic mb-4">{selectedNode.label}</h3>
            <p className="text-sm leading-relaxed opacity-80 mb-8">{selectedNode.description}</p>
            
            <button 
              onClick={handleAtlasJump}
              className="w-full mb-8 py-3 bg-[#E4E3E0] text-[#141414] text-[10px] font-mono uppercase tracking-widest font-bold flex items-center justify-center gap-2 hover:bg-white transition-all shadow-lg"
            >
              <Zap size={10} />
              Jump to Atlas
            </button>

            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-3">Outgoing Effects</h4>
                <div className="space-y-3">
                  {DATA.links.filter(l => (l.source as any).id === selectedNode.id || l.source === selectedNode.id).map((l, i) => (
                    <div key={i} className="p-3 border border-[#E4E3E0]/10 bg-white/5">
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase mb-1">
                        <Zap size={10} className="text-yellow-400" />
                        Affects {(l.target as any).id || l.target}
                      </div>
                      <p className="text-[11px] opacity-60 italic">{l.effect}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-3">Influenced By</h4>
                <div className="space-y-3">
                  {DATA.links.filter(l => (l.target as any).id === selectedNode.id || l.target === selectedNode.id).map((l, i) => (
                    <div key={i} className="p-3 border border-[#E4E3E0]/10 bg-white/5 opacity-60">
                      <div className="text-[10px] font-bold uppercase mb-1">
                        From {(l.source as any).id || l.source}
                      </div>
                      <p className="text-[11px] italic">{l.effect}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover Tooltip */}
      <AnimatePresence>
        {hoveredLink && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute pointer-events-none z-30 bg-white border border-[#141414] p-3 shadow-xl max-w-xs"
            style={{ 
              left: '50%', 
              top: '50%', 
              transform: 'translate(-50%, -50%)' 
            }}
          >
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase mb-1">
              <span className="text-indigo-600">{(hoveredLink.source as any).id}</span>
              <ChevronRight size={10} />
              <span className="text-rose-600">{(hoveredLink.target as any).id}</span>
            </div>
            <p className="text-xs italic leading-tight">{hoveredLink.effect}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-10 bg-white/50 backdrop-blur-sm border border-[#141414]/10 p-4 hidden md:block">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
          {Object.entries(COLORS).map(([group, color]) => (
            <div key={group} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[9px] font-mono uppercase tracking-wider opacity-60">{group}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2 text-[10px] font-mono uppercase opacity-40">
        <Info size={12} />
        <span>Drag nodes to explore • Scroll to zoom • Click for details</span>
      </div>
    </div>
  );
};

const ChevronRight = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6"/>
  </svg>
);
