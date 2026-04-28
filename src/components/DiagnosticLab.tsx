import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  ChevronRight, 
  ArrowRight, 
  AlertCircle, 
  Scale, 
  FlaskConical,
  Dna,
  Wind,
  Heart,
  Brain,
  Zap,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface LabTest {
  id: string;
  name: string;
  description: string;
  optimalRange: string;
  standardRange: string;
  significance: string;
  priority: 'high' | 'medium' | 'low';
}

interface DiagnosticSystem {
  id: string;
  name: string;
  icon: React.ReactNode;
  overview: string;
  tests: LabTest[];
}

const DIAGNOSTIC_DATA: DiagnosticSystem[] = [
  {
    id: 'adrenals',
    name: 'Adrenal Performance',
    icon: <Flame className="w-6 h-6" />,
    overview: 'Assessment of HPA-Axis resiliency, cortisol rhythms, and stress adaptation capacity.',
    tests: [
      {
        id: 'cortisol-am',
        name: 'AM Cortisol (Serum)',
        description: 'Measures the peak of the cortisol awakening response.',
        optimalRange: '15.0 - 20.0 µg/dL',
        standardRange: '6.0 - 23.0 µg/dL',
        significance: 'High AM cortisol indicates acute stress; flat rhythm indicates burnout.',
        priority: 'high'
      },
      {
        id: 'dhea-s',
        name: 'DHEA-S',
        description: 'The primary precursor to sex hormones and counter-balance to cortisol.',
        optimalRange: '350 - 450 µg/dL (Male), 250-350 (Female)',
        standardRange: '100 - 600 µg/dL',
        significance: 'Longevity marker. Low levels associated with feline and cognitive decline.',
        priority: 'medium'
      }
    ]
  },
  {
    id: 'endocrine',
    name: 'Endocrine & Thyroid',
    icon: <Zap className="w-6 h-6" />,
    overview: 'Master metabolic regulation and hormonal signaling pathways.',
    tests: [
      {
        id: 'tsh',
        name: 'TSH (Thyroid Stimulating Hormone)',
        description: 'The pituitary signal to the thyroid gland.',
        optimalRange: '0.5 - 2.0 mIU/L',
        standardRange: '0.45 - 4.5 mIU/L',
        significance: 'Values > 2.0 often correlate with hypothyroid symptoms despite "normal" range.',
        priority: 'high'
      },
      {
        id: 'free-t3',
        name: 'Free T3',
        description: 'The active metabolic hormone that drives cellular energy.',
        optimalRange: '3.2 - 4.2 pg/mL',
        standardRange: '2.0 - 4.4 pg/mL',
        significance: 'The most important indicator of metabolic rate and temperature regulation.',
        priority: 'high'
      }
    ]
  },
  {
    id: 'respiratory',
    name: 'Respiratory Logic',
    icon: <Wind className="w-6 h-6" />,
    overview: 'VO2 Max efficiency and gas exchange indicators.',
    tests: [
      {
        id: 'vo2-max',
        name: 'VO2 Max (Stress Test)',
        description: 'Maximum rate of oxygen consumption during incremental exercise.',
        optimalRange: 'Top 5th Percentile for Age',
        standardRange: 'Population Average',
        significance: 'The strongest predictor of all-cause mortality in longevity science.',
        priority: 'high'
      },
      {
        id: 'fev1',
        name: 'FEV1 / FVC ratio',
        description: 'Measures how much air you can exhale in the first second of a forced breath.',
        optimalRange: '> 0.85',
        standardRange: '> 0.70',
        significance: 'Indicates lung elasticity and airway health.',
        priority: 'medium'
      }
    ]
  },
  {
    id: 'metabolic',
    name: 'Metabolic Spectrum',
    icon: <Scale className="w-6 h-6" />,
    overview: 'Glucose regulation, insulin sensitivity, and glycative stress.',
    tests: [
      {
        id: 'fasting-insulin',
        name: 'Fasting Insulin',
        description: 'Baseline insulin levels before food intake.',
        optimalRange: '2.0 - 5.0 µIU/mL',
        standardRange: '< 25.0 µIU/mL',
        significance: 'Early warning sign of insulin resistance. Often elevated years before HbA1c shifts.',
        priority: 'high'
      },
      {
        id: 'hba1c',
        name: 'HbA1c',
        description: '3-month average of blood glucose.',
        optimalRange: '4.8% - 5.2%',
        standardRange: '4.0% - 5.6%',
        significance: 'Marker of protein glycation and long-term blood sugar management.',
        priority: 'high'
      }
    ]
  },
  {
    id: 'immune',
    name: 'Innate Defense',
    icon: <ShieldCheck className="w-6 h-6" />,
    overview: 'Systemic inflammation and immune surveillance markers.',
    tests: [
      {
        id: 'hs-crp',
        name: 'High-Sensitivity CRP',
        description: 'A sensitive marker of systemic inflammation.',
        optimalRange: '< 0.5 mg/L',
        standardRange: '< 3.0 mg/L',
        significance: 'Directly correlates with cardiovascular risk and systemic "inflammaging".',
        priority: 'high'
      },
      {
        id: 'homocysteine',
        name: 'Homocysteine',
        description: 'A marker of methylation status and cardiovascular irritation.',
        optimalRange: '6.0 - 8.0 µmol/L',
        standardRange: '< 15.0 µmol/L',
        significance: 'High levels indicate B-vitamin deficiencies and neurovascular risk.',
        priority: 'medium'
      }
    ]
  }
];

export const DiagnosticLab: React.FC<{ onDeepDive?: (test: string) => void }> = ({ onDeepDive }) => {
  const [search, setSearch] = useState('');
  const [selectedSystem, setSelectedSystem] = useState<DiagnosticSystem | null>(null);

  const filteredSystems = DIAGNOSTIC_DATA.filter(sys => 
    sys.name.toLowerCase().includes(search.toLowerCase()) ||
    sys.tests.some(t => t.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-6xl font-serif italic mb-2">Diagnostic Lab</h2>
          <p className="text-sm font-mono uppercase tracking-[0.3em] opacity-50">Mapping the Optimal Health Spectrum</p>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
          <input 
            type="text"
            placeholder="Search biomarkers (e.g., TSH, Insulin)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border border-[#141414] py-3 pl-10 pr-4 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#141414] w-full md:w-80"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredSystems.map((system) => (
          <motion.div 
            key={system.id}
            onClick={() => setSelectedSystem(system)}
            className="border border-[#141414] p-8 cursor-pointer group hover:bg-[#141414] hover:text-[#E4E3E0] transition-all duration-500"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="w-10 h-10 border border-current flex items-center justify-center group-hover:bg-[#E4E3E0] group-hover:text-[#141414] transition-colors">
                {system.icon}
              </div>
              <span className="text-[10px] font-mono uppercase opacity-30">{system.tests.length} Biomarkers</span>
            </div>
            
            <h3 className="text-2xl font-serif italic mb-2">{system.name}</h3>
            <p className="text-xs opacity-60 line-clamp-2 mb-8">{system.overview}</p>
            
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border-b border-current pb-1 w-fit opacity-0 group-hover:opacity-100 transition-opacity">
              View Labs <ChevronRight className="w-3 h-3" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedSystem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSystem(null)}
              className="absolute inset-0 bg-[#141414]/90 backdrop-blur-sm"
            />
            
            <motion.div 
              layoutId={selectedSystem.id}
              className="relative w-full max-w-4xl bg-[#E4E3E0] border border-[#141414] shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar">
                <button 
                  onClick={() => setSelectedSystem(null)}
                  className="absolute top-8 right-8 text-[11px] font-mono uppercase tracking-widest opacity-50 hover:opacity-100"
                >
                  [ Back to Lab ]
                </button>

                <div className="mb-12">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 border border-[#141414]">{selectedSystem.icon}</div>
                    <h2 className="text-4xl font-serif italic">{selectedSystem.name} Diagnostics</h2>
                  </div>
                  <p className="text-sm opacity-70 max-w-2xl">{selectedSystem.overview}</p>
                </div>

                <div className="space-y-8">
                  {selectedSystem.tests.map((test) => (
                    <div key={test.id} className="border border-[#141414]/10 p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 hover:border-[#141414] transition-colors">
                      <div className="lg:col-span-5">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-xl font-bold">{test.name}</h4>
                          {test.priority === 'high' && (
                            <span className="text-[8px] bg-red-600 text-white px-2 py-0.5 font-mono uppercase">Critical</span>
                          )}
                        </div>
                        <p className="text-xs opacity-60 italic mb-6">{test.description}</p>
                        <button 
                          onClick={() => onDeepDive?.(test.name)}
                          className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest font-bold hover:underline"
                        >
                          Analyze in Research Engine <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="lg:col-span-4 space-y-4">
                        <div>
                          <span className="text-[10px] font-mono uppercase opacity-40 block mb-1">Optimal Range</span>
                          <span className="text-sm font-bold text-emerald-700">{test.optimalRange}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase opacity-40 block mb-1">Clinical Standard</span>
                          <span className="text-xs opacity-60">{test.standardRange}</span>
                        </div>
                      </div>

                      <div className="lg:col-span-3 bg-[#141414]/5 p-4 border border-[#141414]/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-3 h-3 opacity-40" />
                          <span className="text-[9px] font-mono uppercase opacity-40">Clinical Insight</span>
                        </div>
                        <p className="text-[11px] leading-relaxed italic opacity-80">{test.significance}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="mt-12 p-8 border border-dashed border-[#141414]/20 flex gap-6 items-start opacity-60">
        <FlaskConical className="w-6 h-6 shrink-0 mt-1" />
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest mb-2">The Longevity Spectrum</h4>
          <p className="text-[11px] leading-relaxed">
            Clinical "Normal" ranges are often based on a bell curve of a diseased population. Longevity science focuses on <strong>Optimal Ranges</strong>—values associated with the absence of disease and maximum biological resiliency. 
            Use these markers to identify metabolic drift before it manifests as clinical pathology.
          </p>
        </div>
      </div>
    </div>
  );
};
