import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Search, 
  ChevronRight, 
  ArrowRight,
  Droplet,
  Package,
  Home,
  Utensils,
  Wind,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Toxin {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  sources: string[];
  bioImpact: string;
  longevityImpact: string;
  riskLevel: 'critical' | 'high' | 'moderate';
  recentStudies: { title: string; year: number; journal: string }[];
}

const TOXIN_DATA: Toxin[] = [
  {
    id: 'pfas',
    name: 'PFAS (Forever Chemicals)',
    category: 'Water & Textiles',
    icon: <Droplet className="w-5 h-5" />,
    sources: ['Non-stick cookware', 'Water-resistant clothing', 'Tap water', 'Food packaging'],
    bioImpact: 'Endocrine disruption, thyroid dysfunction, immune system suppression.',
    longevityImpact: 'Accelerates cellular senescence and epigenomic aging by inducing chronic oxidative stress.',
    riskLevel: 'critical',
    recentStudies: [
      { title: 'PFAS Exposure and Accelerated Biological Aging', year: 2025, journal: 'Nature Aging' },
      { title: 'Metabolic interference of perfluoroalkyl substances', year: 2024, journal: 'Environmental Health Perspectives' }
    ]
  },
  {
    id: 'microplastics',
    name: 'Microplastics & Nanoplastics',
    category: 'Food & Water',
    icon: <Utensils className="w-5 h-5" />,
    sources: ['Bottled water', 'Seafood', 'Synthetic clothing shedding', 'Cosmetics'],
    bioImpact: 'Crosses blood-brain barrier, gastrointestinal inflammation, microbiome disruption.',
    longevityImpact: 'Induces oxidative stress and cellular toxicity, potentially accelerating neurodegeneration and cardiovascular aging.',
    riskLevel: 'critical',
    recentStudies: [
      { title: 'Nanoplastics in the cardiovascular system', year: 2025, journal: 'New England Journal of Medicine' },
      { title: 'Microplastic accumulation in human brain tissue', year: 2024, journal: 'The Lancet Planet Health' }
    ]
  },
  {
    id: 'bpa',
    name: 'Bisphenol A (BPA) & BPS',
    category: 'Plastics & Packaging',
    icon: <Package className="w-5 h-5" />,
    sources: ['Thermal receipts', 'Canned food linings', 'Polycarbonate plastics'],
    bioImpact: 'Potent xenoestrogen; disrupts hormone signaling and reproductive health.',
    longevityImpact: 'Promotes telomere shortening and increases risk of age-related metabolic disorders (diabetes, obesity).',
    riskLevel: 'high',
    recentStudies: [
      { title: 'BPA analogues and telomere attrition', year: 2023, journal: 'Cell Metabolism' }
    ]
  },
  {
    id: 'glyphosate',
    name: 'Glyphosate',
    category: 'Agriculture',
    icon: <Home className="w-5 h-5" />,
    sources: ['Non-organic produce', 'Wheat products (desiccation)', 'Parks and lawns'],
    bioImpact: 'Microbiome disruption (shikimate pathway), intestinal permeability.',
    longevityImpact: 'Chronic gut inflammation leads to systemic "inflammaging", a primary driver of accelerated aging.',
    riskLevel: 'high',
    recentStudies: [
      { title: 'Glyphosate-induced microbiome alteration and inflammatory markers', year: 2024, journal: 'Gut Microbes' }
    ]
  },
  {
    id: 'vocs',
    name: 'Volatile Organic Compounds (VOCs)',
    category: 'Air Quality',
    icon: <Wind className="w-5 h-5" />,
    sources: ['New furniture off-gassing', 'Paints', 'Cleaning products', 'Air fresheners'],
    bioImpact: 'Respiratory irritation, neurotoxicity, hepatic stress.',
    longevityImpact: 'Continuous low-grade exposure drains hepatic detoxification pathways, reducing longevity reserve capacity.',
    riskLevel: 'moderate',
    recentStudies: [
      { title: 'Indoor air quality and epigenetic aging clocks', year: 2023, journal: 'Environmental Research' }
    ]
  },
  {
    id: 'heavy-metals',
    name: 'Heavy Metals (Pb, Hg, Cd)',
    category: 'Food & Environment',
    icon: <ShieldAlert className="w-5 h-5" />,
    sources: ['Large fish (Mercury)', 'Old pipes (Lead)', 'Some cocoa/rice (Cadmium)'],
    bioImpact: 'Neurological impairment, kidney damage, displacement of essential minerals.',
    longevityImpact: 'Directly damages mitochondrial DNA and limits ATP production, accelerating systemic biological aging.',
    riskLevel: 'critical',
    recentStudies: [
      { title: 'Cumulative heavy metal exposure and all-cause mortality', year: 2024, journal: 'The Lancet Longevity' }
    ]
  }
];

export const ToxinRadar: React.FC<{ onDeepDive?: (toxin: string) => void }> = ({ onDeepDive }) => {
  const [search, setSearch] = useState('');
  const [selectedToxin, setSelectedToxin] = useState<Toxin | null>(null);

  const filteredToxins = TOXIN_DATA.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.sources.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-6xl font-serif italic mb-2">Toxin Radar</h2>
          <p className="text-sm font-mono uppercase tracking-[0.3em] opacity-50">Environmental Hazards & Longevity Impacts</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
          <input 
            type="text"
            placeholder="Search compounds or sources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border border-[#141414] py-3 pl-10 pr-4 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#141414] w-full md:w-80"
          />
        </div>
      </div>

      <div className="mt-8 p-6 border-l-4 border-red-600 bg-red-50 text-red-900 mb-8">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 shrink-0 mt-1" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest mb-1">The Exposome</h4>
            <p className="text-[11px] leading-relaxed">
              Longevity is heavily influenced by the "exposome"—the measure of all the exposures of an individual in a lifetime and how those exposures relate to health. 
              Modern humans are exposed to thousands of novel synthetic compounds that evolutionary biology has not adapted to detoxify efficiently, acting as potent age-accelerators.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredToxins.map((toxin) => (
          <motion.div 
            key={toxin.id}
            onClick={() => setSelectedToxin(toxin)}
            className="border border-[#141414] p-8 cursor-pointer group hover:bg-[#141414] hover:text-[#E4E3E0] transition-all duration-500 flex flex-col h-full"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 border border-current flex items-center justify-center group-hover:bg-[#E4E3E0] group-hover:text-[#141414] transition-colors">
                {toxin.icon}
              </div>
              <span className={cn(
                "text-[9px] font-mono uppercase tracking-widest px-2 py-1 border",
                toxin.riskLevel === 'critical' ? "border-red-600 text-red-600 group-hover:bg-red-600 group-hover:text-white" :
                toxin.riskLevel === 'high' ? "border-amber-600 text-amber-600" :
                "border-yellow-600 text-yellow-700"
              )}>
                {toxin.riskLevel} Risk
              </span>
            </div>
            
            <h3 className="text-2xl font-serif italic mb-2">{toxin.name}</h3>
            <p className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-6">{toxin.category}</p>
            
            <p className="text-xs opacity-60 line-clamp-3 mb-8 flex-1">{toxin.bioImpact}</p>
            
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border-b border-current pb-1 w-fit opacity-0 group-hover:opacity-100 transition-opacity">
              View Threat Profile <ChevronRight className="w-3 h-3" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedToxin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedToxin(null)}
              className="absolute inset-0 bg-[#141414]/90 backdrop-blur-sm"
            />
            
            <motion.div 
              layoutId={selectedToxin.id}
              className="relative w-full max-w-4xl bg-[#E4E3E0] border border-[#141414] shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar">
                <button 
                  onClick={() => setSelectedToxin(null)}
                  className="absolute top-8 right-8 text-[11px] font-mono uppercase tracking-widest opacity-50 hover:opacity-100"
                >
                  [ Close Profile ]
                </button>

                <div className="mb-12">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 border border-[#141414]">{selectedToxin.icon}</div>
                    <h2 className="text-4xl font-serif italic">{selectedToxin.name}</h2>
                  </div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-[10px] font-mono uppercase tracking-widest opacity-50">Category: {selectedToxin.category}</span>
                    <span className="opacity-30">•</span>
                    <span className={cn(
                      "text-[10px] font-mono uppercase tracking-widest font-bold",
                      selectedToxin.riskLevel === 'critical' ? "text-red-600" :
                      selectedToxin.riskLevel === 'high' ? "text-amber-600" :
                      "text-yellow-700"
                    )}>
                      {selectedToxin.riskLevel} Hazard
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  <div className="lg:col-span-7 space-y-8">
                    <section>
                      <h4 className="text-[11px] font-mono uppercase tracking-widest opacity-40 mb-3 border-b border-[#141414]/10 pb-2">Primary Sources</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedToxin.sources.map((source, i) => (
                          <div key={i} className="px-3 py-1.5 bg-[#141414] text-[#E4E3E0] text-xs">
                            {source}
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h4 className="text-[11px] font-mono uppercase tracking-widest opacity-40 mb-3 border-b border-[#141414]/10 pb-2">Biological Impact</h4>
                      <p className="text-sm leading-relaxed">{selectedToxin.bioImpact}</p>
                    </section>

                    <section className="p-6 bg-red-50 border border-red-200">
                      <h4 className="flex items-center gap-2 text-[11px] font-bold text-red-800 uppercase tracking-widest mb-3">
                        <Activity className="w-4 h-4" /> Longevity Impact
                      </h4>
                      <p className="text-sm leading-relaxed text-red-900">{selectedToxin.longevityImpact}</p>
                    </section>

                    <button 
                      onClick={() => {
                        onDeepDive?.(selectedToxin.name);
                        setSelectedToxin(null);
                      }}
                      className="w-full py-4 border-2 border-[#141414] text-xs font-bold uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors flex items-center justify-center gap-2"
                    >
                      Run Deep Scientific Analysis <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="lg:col-span-5 space-y-6">
                    <h4 className="text-[11px] font-mono uppercase tracking-widest opacity-40 mb-3 border-b border-[#141414]/10 pb-2">Latest Research</h4>
                    <div className="space-y-4">
                      {selectedToxin.recentStudies.map((study, i) => (
                        <div key={i} className="p-4 border border-[#141414]/10 bg-white">
                          <h5 className="text-sm font-bold mb-2 leading-tight">{study.title}</h5>
                          <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-widest opacity-50">
                            <span>{study.journal}</span>
                            <span>{study.year}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
