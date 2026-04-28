import React, { useState } from 'react';
import { 
  Brain, 
  Heart, 
  Wind, 
  Shield, 
  Zap, 
  Activity, 
  Sun, 
  Flame, 
  Waves, 
  Search,
  Info,
  ExternalLink,
  Filter,
  ChevronRight,
  Zap as ZapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Compound {
  name: string;
  type: 'modern' | 'ayurvedic' | 'tcm';
  benefit: string;
}

interface OrganSystem {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  compounds: Compound[];
  hormones: string[];
}

const SYSTEMS: OrganSystem[] = [
  {
    id: 'brain',
    name: 'Brain & Cognition',
    icon: <Brain className="w-6 h-6" />,
    description: 'The command center for executive function, memory, and emotional regulation.',
    hormones: ['DHEA', 'Pregnenolone', 'Melatonin', 'Oxytocin'],
    compounds: [
      { name: 'Lion\'s Mane', type: 'tcm', benefit: 'Stimulates Nerve Growth Factor (NGF)' },
      { name: 'Brahmi (Bacopa)', type: 'ayurvedic', benefit: 'Enhances synaptic communication' },
      { name: 'Omega-3 (DHA)', type: 'modern', benefit: 'Structural component of brain tissue' },
      { name: 'Ginkgo Biloba', type: 'tcm', benefit: 'Improves cerebral blood flow' },
      { name: 'Ashwagandha', type: 'ayurvedic', benefit: 'Reduces cortisol-induced neurotoxicity' },
      { name: 'Phosphatidylserine', type: 'modern', benefit: 'Supports cell membrane integrity' }
    ]
  },
  {
    id: 'heart',
    name: 'Cardiovascular',
    icon: <Heart className="w-6 h-6" />,
    description: 'Systemic circulation, oxygen delivery, and heart rate variability.',
    hormones: ['Atrial Natriuretic Peptide', 'Epinephrine'],
    compounds: [
      { name: 'Arjuna', type: 'ayurvedic', benefit: 'Strengthens cardiac muscle' },
      { name: 'Dan Shen', type: 'tcm', benefit: 'Promotes blood circulation' },
      { name: 'CoQ10', type: 'modern', benefit: 'Mitochondrial energy for heart cells' },
      { name: 'Hawthorn Berry', type: 'modern', benefit: 'Supports healthy blood pressure' },
      { name: 'Guggul', type: 'ayurvedic', benefit: 'Regulates lipid metabolism' },
      { name: 'Magnesium Taurate', type: 'modern', benefit: 'Stabilizes heart rhythm' }
    ]
  },
  {
    id: 'liver',
    name: 'Hepatic System',
    icon: <Activity className="w-6 h-6" />,
    description: 'Primary detoxification, metabolic filtering, and bile production.',
    hormones: ['IGF-1', 'Angiotensinogen', 'Thrombopoietin'],
    compounds: [
      { name: 'Milk Thistle (Silymarin)', type: 'modern', benefit: 'Protects hepatocytes from toxins' },
      { name: 'Kutki', type: 'ayurvedic', benefit: 'Potent liver stimulant and cholagogue' },
      { name: 'Schisandra Berry', type: 'tcm', benefit: 'Supports Phase I & II detox' },
      { name: 'NAC', type: 'modern', benefit: 'Precursor to Glutathione' },
      { name: 'Bhumyamalaki', type: 'ayurvedic', benefit: 'Anti-viral and liver protective' },
      { name: 'Artichoke Extract', type: 'modern', benefit: 'Stimulates bile flow' }
    ]
  },
  {
    id: 'gut',
    name: 'Gastrointestinal',
    icon: <Waves className="w-6 h-6" />,
    description: 'Nutrient absorption, immune priming, and the microbiome axis.',
    hormones: ['Gastrin', 'Secretin', 'Cholecystokinin', 'Ghrelin'],
    compounds: [
      { name: 'Triphala', type: 'ayurvedic', benefit: 'Gentle colon cleanser and toner' },
      { name: 'Ginger', type: 'tcm', benefit: 'Warms the middle jiao, aids digestion' },
      { name: 'L-Glutamine', type: 'modern', benefit: 'Repairs intestinal lining (leaky gut)' },
      { name: 'Berberine', type: 'tcm', benefit: 'Balances gut flora and insulin' },
      { name: 'Licorice (DGL)', type: 'ayurvedic', benefit: 'Soothes gastric mucosa' },
      { name: 'Probiotics', type: 'modern', benefit: 'Restores microbial diversity' }
    ]
  },
  {
    id: 'lungs',
    name: 'Respiratory',
    icon: <Wind className="w-6 h-6" />,
    description: 'Gas exchange, pH balance, and protection from airborne pathogens.',
    hormones: ['Angiotensin I to II conversion'],
    compounds: [
      { name: 'Vasaka (Adhatoda)', type: 'ayurvedic', benefit: 'Powerful bronchodilator' },
      { name: 'Cordyceps', type: 'tcm', benefit: 'Increases oxygen utilization' },
      { name: 'Quercetin', type: 'modern', benefit: 'Stabilizes mast cells (anti-allergy)' },
      { name: 'Mullein Leaf', type: 'modern', benefit: 'Expectorant and lung tonic' },
      { name: 'Astragalus', type: 'tcm', benefit: 'Strengthens "Wei Qi" (defensive energy)' },
      { name: 'Tulsi (Holy Basil)', type: 'ayurvedic', benefit: 'Clears congestion and stress' }
    ]
  },
  {
    id: 'kidneys',
    name: 'Renal System',
    icon: <Shield className="w-6 h-6" />,
    description: 'Fluid balance, waste filtration, and blood pressure regulation.',
    hormones: ['Erythropoietin', 'Renin', 'Calcitriol'],
    compounds: [
      { name: 'Punarnava', type: 'ayurvedic', benefit: 'Diuretic and kidney rejuvenator' },
      { name: 'Astragalus Root', type: 'tcm', benefit: 'Reduces proteinuria' },
      { name: 'Alpha Lipoic Acid', type: 'modern', benefit: 'Protects against diabetic nephropathy' },
      { name: 'Rehmannia', type: 'tcm', benefit: 'Nourishes kidney Yin' },
      { name: 'Gokshura', type: 'ayurvedic', benefit: 'Supports urinary tract health' },
      { name: 'Resveratrol', type: 'modern', benefit: 'Anti-inflammatory for renal tissue' }
    ]
  },
  {
    id: 'thyroid',
    name: 'Endocrine (Thyroid)',
    icon: <Zap className="w-6 h-6" />,
    description: 'Master regulator of metabolism, temperature, and cellular energy.',
    hormones: ['T3 (Triiodothyronine)', 'T4 (Thyroxine)', 'Calcitonin'],
    compounds: [
      { name: 'Kanchanar Guggul', type: 'ayurvedic', benefit: 'Reduces glandular swelling' },
      { name: 'Sea Kelp', type: 'modern', benefit: 'Natural source of Iodine' },
      { name: 'Selenium', type: 'modern', benefit: 'Required for T4 to T3 conversion' },
      { name: 'Ashwagandha', type: 'ayurvedic', benefit: 'Supports T4 production' },
      { name: 'L-Tyrosine', type: 'modern', benefit: 'Amino acid precursor to thyroid hormones' },
      { name: 'Bladderwrack', type: 'tcm', benefit: 'Rich in minerals for thyroid health' }
    ]
  },
  {
    id: 'skin',
    name: 'Integumentary',
    icon: <Sun className="w-6 h-6" />,
    description: 'The body\'s largest organ, providing protection and sensory input.',
    hormones: ['Vitamin D synthesis'],
    compounds: [
      { name: 'Neem', type: 'ayurvedic', benefit: 'Purifies blood and clears skin' },
      { name: 'Goji Berry', type: 'tcm', benefit: 'Rich in antioxidants for skin glow' },
      { name: 'Collagen Peptides', type: 'modern', benefit: 'Structural support and elasticity' },
      { name: 'Gotu Kola', type: 'ayurvedic', benefit: 'Promotes wound healing and collagen' },
      { name: 'Pearl Powder', type: 'tcm', benefit: 'Traditional skin brightening agent' },
      { name: 'Hyaluronic Acid', type: 'modern', benefit: 'Deep cellular hydration' }
    ]
  },
  {
    id: 'adrenals',
    name: 'Adrenal Glands',
    icon: <Flame className="w-6 h-6" />,
    description: 'Stress response, electrolyte balance, and energy mobilization.',
    hormones: ['Cortisol', 'Aldosterone', 'Adrenaline', 'DHEA'],
    compounds: [
      { name: 'Holy Basil', type: 'ayurvedic', benefit: 'Modulates the stress response' },
      { name: 'Reishi Mushroom', type: 'tcm', benefit: 'Calms the nervous system' },
      { name: 'Rhodiola Rosea', type: 'modern', benefit: 'Increases resistance to fatigue' },
      { name: 'Licorice Root', type: 'tcm', benefit: 'Supports cortisol half-life' },
      { name: 'Siberian Ginseng', type: 'modern', benefit: 'Enhances physical endurance' },
      { name: 'Vitamin C', type: 'modern', benefit: 'High concentration found in adrenal cortex' }
    ]
  }
];

interface BiologicalAtlasProps {
  onTriggerResearch?: (target: string) => void;
  onJumpToDiagnostics?: (systemId: string) => void;
  startSystemId?: string | null;
}

export const BiologicalAtlas: React.FC<BiologicalAtlasProps> = ({ onTriggerResearch, onJumpToDiagnostics, startSystemId }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'modern' | 'ayurvedic' | 'tcm'>('all');
  const [initialSystem] = useState(() => {
    if (startSystemId) {
      return SYSTEMS.find(s => s.id === startSystemId) || null;
    }
    return null;
  });
  const [selectedSystem, setSelectedSystem] = useState<OrganSystem | null>(initialSystem);

  React.useEffect(() => {
    if (startSystemId) {
      const system = SYSTEMS.find(s => s.id === startSystemId);
      if (system) setSelectedSystem(system);
    }
  }, [startSystemId]);

  const handleDeepDive = (target: string) => {
    if (onTriggerResearch) {
      onTriggerResearch(target);
    }
  };

  const filteredSystems = SYSTEMS.filter(system => 
    system.name.toLowerCase().includes(search.toLowerCase()) ||
    system.compounds.some(c => c.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-5xl font-serif italic mb-2">Biological Atlas</h2>
          <p className="text-sm font-mono uppercase tracking-[0.3em] opacity-50">Systemic Mapping of Compounds & Hormones</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
            <input 
              type="text"
              placeholder="Search organ or compound..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border border-[#141414] py-2 pl-10 pr-4 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#141414] w-full md:w-64"
            />
          </div>
          <div className="flex border border-[#141414]">
            {(['all', 'modern', 'ayurvedic', 'tcm'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-2 text-[9px] font-mono uppercase tracking-widest transition-all",
                  filter === f ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/5"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Systems */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredSystems.map((system) => (
          <motion.div 
            key={system.id}
            layoutId={system.id}
            onClick={() => setSelectedSystem(system)}
            className="group border border-[#141414] p-8 cursor-pointer hover:bg-[#141414] hover:text-[#E4E3E0] transition-all duration-500 flex flex-col h-full"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="w-12 h-12 border border-current flex items-center justify-center group-hover:bg-[#E4E3E0] group-hover:text-[#141414] transition-colors">
                {system.icon}
              </div>
              <div className="text-[10px] font-mono uppercase opacity-40 group-hover:opacity-60">
                {system.compounds.length} Compounds
              </div>
            </div>

            <h3 className="text-2xl font-serif italic mb-3">{system.name}</h3>
            <p className="text-xs leading-relaxed opacity-60 group-hover:opacity-80 mb-8 flex-1">
              {system.description}
            </p>

            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-widest opacity-40 mb-2 block">Key Hormones</span>
                <div className="flex flex-wrap gap-2">
                  {system.hormones.slice(0, 3).map((h, i) => (
                    <span key={i} className="text-[10px] font-bold border border-current/20 px-2 py-0.5">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t border-current/10 flex justify-between items-center text-[10px] font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Explore Atlas</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSystem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSystem(null)}
              className="absolute inset-0 bg-[#141414]/80 backdrop-blur-sm"
            />
            
            <motion.div 
              layoutId={selectedSystem.id}
              className="relative w-full max-w-5xl bg-[#E4E3E0] border border-[#141414] shadow-2xl overflow-hidden flex flex-col max-h-full"
            >
              <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar">
                <button 
                  onClick={() => setSelectedSystem(null)}
                  className="absolute top-8 right-8 text-[10px] font-mono uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
                >
                  [ Close Atlas ]
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Left Column: Info */}
                  <div className="lg:col-span-4 space-y-8">
                    <div className="w-20 h-20 border border-[#141414] flex items-center justify-center">
                      {selectedSystem.icon}
                    </div>
                    <div>
                      <h2 className="text-5xl font-serif italic mb-4">{selectedSystem.name}</h2>
                      <p className="text-sm leading-relaxed opacity-70 mb-6">{selectedSystem.description}</p>
                      
                      {onJumpToDiagnostics && (
                        <button 
                          onClick={() => onJumpToDiagnostics(selectedSystem.id)}
                          className="flex items-center gap-2 px-4 py-2 border border-[#141414] text-[10px] font-mono uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                        >
                          <Activity className="w-3 h-3" /> View Diagnostic Specs
                        </button>
                      )}
                    </div>

                      <div className="space-y-4">
                        <h4 className="text-[11px] font-mono uppercase tracking-widest opacity-40 border-b border-[#141414]/10 pb-2">Hormonal Profile</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedSystem.hormones.map((h, i) => (
                            <button 
                              key={i} 
                              onClick={() => handleDeepDive(h)}
                              className="group/btn relative px-3 py-1 bg-[#141414] text-[#E4E3E0] text-[10px] font-bold uppercase tracking-wider hover:pr-8 transition-all"
                            >
                              {h}
                              <ChevronRight className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/btn:opacity-100 transition-all" />
                            </button>
                          ))}
                        </div>
                      </div>

                    <div className="p-6 bg-[#141414]/5 border border-[#141414]/10">
                      <div className="flex items-center gap-2 mb-3">
                        <Info className="w-4 h-4 opacity-40" />
                        <span className="text-[10px] font-mono uppercase tracking-widest opacity-40">Clinical Note</span>
                      </div>
                      <p className="text-[11px] italic opacity-60">
                        This mapping represents a synthesis of modern endocrinology, traditional Ayurvedic dravyas, and Chinese materia medica. Always cross-reference with the Research Engine for specific safety data.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Compounds */}
                  <div className="lg:col-span-8">
                    <h4 className="text-[11px] font-mono uppercase tracking-widest opacity-40 mb-6 border-b border-[#141414]/10 pb-2">Therapeutic Compounds</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedSystem.compounds
                        .filter(c => filter === 'all' || c.type === filter)
                        .map((compound, i) => (
                        <div 
                          key={i} 
                          onClick={() => handleDeepDive(compound.name)}
                          className="p-6 border border-[#141414]/10 hover:border-[#141414] transition-all group/card cursor-pointer relative overflow-hidden"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="text-lg font-bold">{compound.name}</h5>
                            <span className={cn(
                              "text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 border",
                              compound.type === 'modern' ? "border-blue-500 text-blue-600" :
                              compound.type === 'ayurvedic' ? "border-amber-600 text-amber-700" :
                              "border-emerald-600 text-emerald-700"
                            )}>
                              {compound.type}
                            </span>
                          </div>
                          <p className="text-xs opacity-60 leading-relaxed italic group-hover/card:opacity-90 transition-opacity">
                            {compound.benefit}
                          </p>
                          <div className="mt-4 flex items-center justify-between text-[9px] font-mono uppercase opacity-0 group-hover/card:opacity-40 transition-opacity">
                            <span>Deep Research</span>
                            <ZapIcon className="w-3 h-3" />
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedSystem.compounds.filter(c => filter === 'all' || c.type === filter).length === 0 && (
                      <div className="py-20 text-center border border-dashed border-[#141414]/20">
                        <p className="text-sm font-mono opacity-40 italic">No compounds match the selected filter.</p>
                      </div>
                    )}
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
