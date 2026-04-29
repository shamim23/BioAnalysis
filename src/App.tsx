import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Beaker, 
  ShieldAlert, 
  FileText, 
  Activity, 
  ChevronRight, 
  Loader2, 
  Dna,
  AlertCircle,
  CheckCircle2,
  History,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { BioResearchService } from './services/bioResearchService';
import { OptimizationHub } from './components/OptimizationHub';
import { KnowledgeGraph } from './components/KnowledgeGraph';
import { BiologicalAtlas } from './components/BiologicalAtlas';
import { ProfessionalDashboard } from './components/ProfessionalDashboard';
import { DiagnosticLab } from './components/DiagnosticLab';
import { ToxinRadar } from './components/ToxinRadar';
import { cn } from './lib/utils';
import { AgentStatus, ResearchReport } from './types';

const AGENTS_CONFIG: Omit<AgentStatus, 'status'>[] = [
  { id: 'discovery', name: 'Discovery Agent', role: 'Scientific Literature Researcher' },
  { id: 'analysis', name: 'Analysis Agent', role: 'Data Extraction & Evidence Evaluator' },
  { id: 'safety', name: 'Safety Agent', role: 'Clinical Toxicologist' },
  { id: 'marketplace', name: 'Marketplace Agent', role: 'Commercial Sourcing Analyst' },
  { id: 'comparison', name: 'Comparison Agent', role: 'Product Analyst & Scraper' },
  { id: 'purity', name: 'Purity Agent', role: 'Contaminant & Recall Specialist' },
  { id: 'synthesis', name: 'Synthesis Agent', role: 'Chief Medical Synthesizer' },
  { id: 'citations', name: 'Citation Auditor', role: 'Verifies cited sources against discovery' },
];

export default function App() {
  const [mode, setMode] = useState<'research' | 'optimization' | 'graph' | 'atlas' | 'professional' | 'diagnostics' | 'toxin'>('research');
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [compound, setCompound] = useState('');
  const [biomarkers, setBiomarkers] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'marketplace' | 'comparison' | 'purity'>('report');
  const [agents, setAgents] = useState<AgentStatus[]>(
    AGENTS_CONFIG.map(a => ({ ...a, status: 'idle' }))
  );
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ResearchReport[]>([]);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [agents]);

  useEffect(() => {
    if (mode !== 'atlas') {
      setSelectedSystemId(null);
    }
  }, [mode]);

  const updateAgent = (id: string, updates: Partial<AgentStatus>) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const triggerResearch = (targetCompound: string, targetBiomarkers?: string) => {
    setCompound(targetCompound);
    if (targetBiomarkers) setBiomarkers(targetBiomarkers);
    setMode('research');
    // We use a timeout to let the state update before triggering the form submit logic
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) form.requestSubmit();
    }, 100);
  };

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compound.trim()) return;

    setIsResearching(true);
    setError(null);
    setReport(null);
    setActiveTab('report');
    setAgents(AGENTS_CONFIG.map(a => ({ ...a, status: 'idle' })));

    const service = new BioResearchService();

    try {
      // 1. Discovery (gates everything else)
      updateAgent('discovery', { status: 'running' });
      const discoveryData = await service.runDiscovery(compound);
      updateAgent('discovery', {
        status: 'completed',
        output: `${discoveryData.studies.length} studies. ${discoveryData.searchSummary}`,
      });

      // 2/3 Analysis chain runs in parallel with 4/5/6 Marketplace chain
      const analysisChain = (async () => {
        updateAgent('analysis', { status: 'running' });
        const analysisData = await service.runAnalysis(compound, discoveryData);
        updateAgent('analysis', { status: 'completed', output: analysisData });

        updateAgent('safety', { status: 'running' });
        const safetyData = await service.runSafetyCheck(compound, analysisData);
        updateAgent('safety', { status: 'completed', output: safetyData });

        return { analysisData, safetyData };
      })();

      const marketplaceChain = (async () => {
        updateAgent('marketplace', { status: 'running' });
        const products = await service.runMarketplaceSearch(compound);
        updateAgent('marketplace', { status: 'completed', output: `Found ${products.length} recommended products.` });

        updateAgent('comparison', { status: 'running' });
        updateAgent('purity', { status: 'running' });
        const [comparison, purity] = await Promise.all([
          service.runProductComparison(compound, products).then(r => {
            updateAgent('comparison', { status: 'completed', output: `Compared ${products.length} products.` });
            return r;
          }),
          service.runContaminantCheck(compound, products).then(r => {
            updateAgent('purity', { status: 'completed', output: `Checked ${r.alerts.length} alerts.` });
            return r;
          }),
        ]);
        return { products, comparison, purity };
      })();

      const [{ analysisData, safetyData }, { products, comparison, purity }] = await Promise.all([
        analysisChain,
        marketplaceChain,
      ]);

      // 7. Synthesis (needs analysis + safety + discovery)
      updateAgent('synthesis', { status: 'running' });
      const finalContent = await service.runSynthesis(compound, discoveryData, analysisData, safetyData, biomarkers);
      updateAgent('synthesis', { status: 'completed', output: finalContent });

      // 8. Citation audit
      updateAgent('citations', { status: 'running' });
      let citations;
      try {
        citations = await service.runCitationCheck(compound, finalContent, discoveryData);
        updateAgent('citations', {
          status: 'completed',
          output: `${citations.verified.length}/${citations.total} verified, ${citations.unverifiable.length} unverifiable.`,
        });
      } catch (err) {
        console.warn('Citation check failed', err);
        updateAgent('citations', { status: 'error', output: 'Citation audit unavailable.' });
      }

      const newReport: ResearchReport = {
        compound,
        biomarkers,
        timestamp: new Date().toISOString(),
        content: finalContent || 'Failed to generate report content.',
        products,
        comparison,
        purity,
        citations,
      };

      setReport(newReport);
      setHistory(prev => [newReport, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during the research pipeline.");
      setAgents(prev => prev.map(a => a.status === 'running' ? { ...a, status: 'error' } : a));
    } finally {
      setIsResearching(false);
    }
  };

  const jumpToAtlas = (systemId: string) => {
    setSelectedSystemId(systemId);
    setMode('atlas');
  };

  const jumpToDiagnostics = (systemId: string) => {
    setMode('diagnostics');
    // We could pass a search term here if needed
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-[#E4E3E0] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#141414] flex items-center justify-center rounded-sm">
            <Dna className="text-[#E4E3E0] w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase">Bio-Compound Analyzer</h1>
            <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Scientific Pipeline v1.0.5</p>
          </div>
        </div>

        <nav className="hidden md:flex gap-8">
          <button 
            onClick={() => setMode('research')}
            className={cn(
              "text-[10px] font-mono uppercase tracking-[0.2em] pb-1 border-b transition-all",
              mode === 'research' ? "border-[#141414] opacity-100" : "border-transparent opacity-40 hover:opacity-100"
            )}
          >
            Research Engine
          </button>
          <button 
            onClick={() => setMode('optimization')}
            className={cn(
              "text-[10px] font-mono uppercase tracking-[0.2em] pb-1 border-b transition-all",
              mode === 'optimization' ? "border-[#141414] opacity-100" : "border-transparent opacity-40 hover:opacity-100"
            )}
          >
            Optimization Hub
          </button>
          <button 
            onClick={() => setMode('graph')}
            className={cn(
              "text-[10px] font-mono uppercase tracking-[0.2em] pb-1 border-b transition-all",
              mode === 'graph' ? "border-[#141414] opacity-100" : "border-transparent opacity-40 hover:opacity-100"
            )}
          >
            Knowledge Graph
          </button>
          <button 
            onClick={() => setMode('atlas')}
            className={cn(
              "text-[10px] font-mono uppercase tracking-[0.2em] pb-1 border-b transition-all",
              mode === 'atlas' ? "border-[#141414] opacity-100" : "border-transparent opacity-40 hover:opacity-100"
            )}
          >
            Biological Atlas
          </button>
          <button 
            onClick={() => setMode('professional')}
            className={cn(
              "text-[10px] font-mono uppercase tracking-[0.2em] pb-1 border-b transition-all",
              mode === 'professional' ? "border-[#141414] opacity-100" : "border-transparent opacity-40 hover:opacity-100"
            )}
          >
            Pro Dashboard
          </button>
          <button 
            onClick={() => setMode('diagnostics')}
            className={cn(
              "text-[10px] font-mono uppercase tracking-[0.2em] pb-1 border-b transition-all",
              mode === 'diagnostics' ? "border-[#141414] opacity-100" : "border-transparent opacity-40 hover:opacity-100"
            )}
          >
            Diagnostic Lab
          </button>
          <button 
            onClick={() => setMode('toxin')}
            className={cn(
              "text-[10px] font-mono uppercase tracking-[0.2em] pb-1 border-b transition-all",
              mode === 'toxin' ? "border-[#141414] opacity-100" : "border-transparent opacity-40 hover:opacity-100"
            )}
          >
            Toxin Radar
          </button>
        </nav>

        <div className="hidden md:flex items-center gap-6 text-[11px] font-mono uppercase tracking-wider opacity-60">
          <span>Status: System Ready</span>
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </header>

      <main className={cn(
        "min-h-[calc(100vh-89px)]",
        mode === 'research' ? "grid grid-cols-1 lg:grid-cols-12" : "block p-6 lg:p-12"
      )}>
        <AnimatePresence mode="wait">
          {mode === 'optimization' ? (
            <motion.div
              key="optimization"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <OptimizationHub onTriggerResearch={triggerResearch} />
            </motion.div>
          ) : mode === 'graph' ? (
            <motion.div
              key="graph"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <KnowledgeGraph onJumpToAtlas={jumpToAtlas} />
            </motion.div>
          ) : mode === 'atlas' ? (
            <motion.div
              key="atlas"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <BiologicalAtlas 
                onTriggerResearch={triggerResearch} 
                onJumpToDiagnostics={jumpToDiagnostics}
                startSystemId={selectedSystemId} 
              />
            </motion.div>
          ) : mode === 'professional' ? (
            <motion.div
              key="professional"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <ProfessionalDashboard />
            </motion.div>
          ) : mode === 'diagnostics' ? (
            <motion.div
              key="diagnostics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <DiagnosticLab onDeepDive={triggerResearch} />
            </motion.div>
          ) : mode === 'toxin' ? (
            <motion.div
              key="toxin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <ToxinRadar onDeepDive={triggerResearch} />
            </motion.div>
          ) : (
            <React.Fragment key="research">
              {/* Sidebar - Controls */}
              <aside className="lg:col-span-3 border-r border-[#141414] p-6 flex flex-col gap-8">
                <section>
                  <h2 className="text-[11px] font-serif italic opacity-50 uppercase tracking-widest mb-4">Research Parameters</h2>
                  <form onSubmit={handleResearch} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-mono uppercase mb-1 block opacity-70">Target Compound</label>
                      <input 
                        type="text"
                        value={compound}
                        onChange={(e) => setCompound(e.target.value)}
                        placeholder="e.g. DHEA, Resveratrol, NAD+"
                        className="w-full bg-transparent border border-[#141414] p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#141414] placeholder:opacity-30"
                        disabled={isResearching}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono uppercase mb-1 block opacity-70">User Biomarkers (Optional)</label>
                      <textarea 
                        value={biomarkers}
                        onChange={(e) => setBiomarkers(e.target.value)}
                        placeholder="Age, gender, specific lab values..."
                        rows={4}
                        className="w-full bg-transparent border border-[#141414] p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#141414] placeholder:opacity-30 resize-none"
                        disabled={isResearching}
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isResearching || !compound.trim()}
                      className={cn(
                        "w-full py-4 px-6 flex items-center justify-center gap-2 transition-all duration-200 uppercase text-xs font-bold tracking-widest",
                        isResearching 
                          ? "bg-transparent border border-[#141414] cursor-not-allowed" 
                          : "bg-[#141414] text-[#E4E3E0] hover:bg-opacity-90 active:scale-[0.98]"
                      )}
                    >
                      {isResearching ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          Initiate Pipeline
                        </>
                      )}
                    </button>
                  </form>
                </section>

                <section className="mt-auto">
                  <h2 className="text-[11px] font-serif italic opacity-50 uppercase tracking-widest mb-4">Recent History</h2>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {history.length === 0 ? (
                      <p className="text-[10px] font-mono opacity-30 italic">No previous reports</p>
                    ) : (
                      history.map((h, i) => (
                        <button 
                          key={i}
                          onClick={() => {
                            setReport(h);
                            setActiveTab('report');
                          }}
                          className="w-full text-left p-2 border border-[#141414]/10 hover:border-[#141414] transition-colors group"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold truncate">{h.compound}</span>
                            <History className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <span className="text-[9px] font-mono opacity-50">{new Date(h.timestamp).toLocaleDateString()}</span>
                        </button>
                      ))
                    )}
                  </div>
                </section>
              </aside>

              {/* Main Content Area */}
              <div className="lg:col-span-9 flex flex-col h-full">
                {/* Agent Activity Bar */}
                <div className="border-b border-[#141414] bg-[#141414]/5 p-4 flex flex-wrap gap-4 items-center">
                  {agents.map((agent) => (
                    <div 
                      key={agent.id}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 border transition-all duration-300",
                        agent.status === 'running' ? "border-[#141414] bg-[#141414] text-[#E4E3E0]" : 
                        agent.status === 'completed' ? "border-[#141414] bg-[#141414]/10" :
                        "border-[#141414]/20 opacity-40"
                      )}
                    >
                      {agent.status === 'running' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : agent.status === 'completed' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : agent.status === 'error' ? (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      ) : (
                        <div className="w-3 h-3 rounded-full border border-current opacity-30" />
                      )}
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-tight leading-none">{agent.name}</span>
                        <span className="text-[8px] font-mono opacity-60 leading-none mt-1">{agent.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Report / Log Display */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 p-6 flex gap-4 items-start mb-8"
                      >
                        <ShieldAlert className="text-red-500 w-6 h-6 flex-shrink-0" />
                        <div>
                          <h3 className="text-red-800 font-bold uppercase text-sm mb-1">Pipeline Interrupted</h3>
                          <p className="text-red-700 text-sm">{error}</p>
                        </div>
                      </motion.div>
                    )}

                    {isResearching ? (
                      <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-8"
                      >
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="relative mb-6">
                            <motion.div 
                              animate={{ rotate: 360 }}
                              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                              className="w-24 h-24 border-t-2 border-r-2 border-[#141414] rounded-full"
                            />
                            <Dna className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-20" />
                          </div>
                          <h2 className="text-2xl font-serif italic mb-2">Analyzing Biological Data...</h2>
                          <p className="text-sm font-mono opacity-50 max-w-md">
                            Agents are currently cross-referencing PubMed databases and evaluating clinical evidence strength.
                          </p>
                        </div>

                        {/* Live Log */}
                        <div className="border border-[#141414] p-4 font-mono text-[11px] bg-[#141414] text-[#E4E3E0] max-h-[300px] overflow-y-auto">
                          <div className="flex items-center gap-2 mb-4 border-b border-[#E4E3E0]/20 pb-2">
                            <Activity className="w-3 h-3" />
                            <span className="uppercase tracking-widest">Live Execution Log</span>
                          </div>
                          {agents.filter(a => a.status !== 'idle').map((a, i) => (
                            <div key={i} className="mb-4 animate-in fade-in slide-in-from-left-2 duration-500">
                              <div className="flex items-center gap-2 text-[#E4E3E0]/50">
                                <span className="text-emerald-400">[{new Date().toLocaleTimeString()}]</span>
                                <span className="font-bold uppercase">{a.name}</span>
                                <ChevronRight className="w-3 h-3" />
                                <span>{a.status === 'running' ? 'Processing task...' : 'Task complete.'}</span>
                              </div>
                              {a.output && (
                                <div className="mt-1 pl-4 border-l border-[#E4E3E0]/10 opacity-70 line-clamp-2">
                                  {a.output}
                                </div>
                              )}
                            </div>
                          ))}
                          <div ref={logEndRef} />
                        </div>
                      </motion.div>
                    ) : report ? (
                      <motion.div 
                        key="report"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl mx-auto"
                      >
                        {/* Tabs */}
                        <div className="flex gap-8 mb-12 border-b border-[#141414]/10">
                          <button 
                            onClick={() => setActiveTab('report')}
                            className={cn(
                              "pb-4 text-xs font-bold uppercase tracking-widest transition-all relative",
                              activeTab === 'report' ? "text-[#141414]" : "text-[#141414]/40 hover:text-[#141414]"
                            )}
                          >
                            Scientific Report
                            {activeTab === 'report' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#141414]" />}
                          </button>
                          <button 
                            onClick={() => setActiveTab('marketplace')}
                            className={cn(
                              "pb-4 text-xs font-bold uppercase tracking-widest transition-all relative",
                              activeTab === 'marketplace' ? "text-[#141414]" : "text-[#141414]/40 hover:text-[#141414]"
                            )}
                          >
                            Marketplace
                            {activeTab === 'marketplace' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#141414]" />}
                          </button>
                          <button 
                            onClick={() => setActiveTab('comparison')}
                            className={cn(
                              "pb-4 text-xs font-bold uppercase tracking-widest transition-all relative",
                              activeTab === 'comparison' ? "text-[#141414]" : "text-[#141414]/40 hover:text-[#141414]"
                            )}
                          >
                            Comparison
                            {activeTab === 'comparison' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#141414]" />}
                          </button>
                          <button 
                            onClick={() => setActiveTab('purity')}
                            className={cn(
                              "pb-4 text-xs font-bold uppercase tracking-widest transition-all relative",
                              activeTab === 'purity' ? "text-[#141414]" : "text-[#141414]/40 hover:text-[#141414]"
                            )}
                          >
                            Purity & Alerts
                            {activeTab === 'purity' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#141414]" />}
                          </button>
                        </div>

                        {activeTab === 'report' ? (
                          <div className="animate-in fade-in duration-500">
                            <div className="flex justify-between items-end border-b-2 border-[#141414] pb-4 mb-12">
                              <div>
                                <div className="flex items-center gap-2 text-[10px] font-mono uppercase opacity-50 mb-2">
                                  <FileText className="w-3 h-3" />
                                  Final Synthesis Report
                                </div>
                                <h2 className="text-6xl font-serif italic leading-none">{report.compound}</h2>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] font-mono uppercase opacity-50">Generated On</div>
                                <div className="text-sm font-bold">{new Date(report.timestamp).toLocaleDateString()}</div>
                              </div>
                            </div>

                            <div className="prose prose-neutral max-w-none 
                              prose-h1:text-4xl prose-h1:font-serif prose-h1:italic prose-h1:mb-8 prose-h1:border-b prose-h1:border-[#141414]/10 prose-h1:pb-4
                              prose-h2:text-xl prose-h2:font-bold prose-h2:uppercase prose-h2:tracking-wider prose-h2:mt-12 prose-h2:mb-6 prose-h2:flex prose-h2:items-center prose-h2:gap-3
                              prose-p:text-base prose-p:leading-relaxed prose-p:mb-6 prose-p:text-[#141414]/80
                              prose-li:text-[#141414]/80 prose-li:mb-2
                              prose-strong:text-[#141414] prose-strong:font-bold
                              prose-blockquote:border-l-4 prose-blockquote:border-[#141414] prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-lg
                            ">
                              <Markdown>{report.content}</Markdown>
                            </div>
                          </div>
                        ) : activeTab === 'marketplace' ? (
                          <div className="animate-in fade-in duration-500">
                            <div className="mb-12">
                              <h2 className="text-4xl font-serif italic mb-2">Recommended Sourcing</h2>
                              <p className="text-sm font-mono opacity-50 uppercase tracking-widest">Verified Commercial Forms for {report.compound}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {report.products && report.products.length > 0 ? (
                                report.products.map((product, i) => (
                                  <div key={i} className="border border-[#141414] p-6 flex flex-col group hover:bg-[#141414] hover:text-[#E4E3E0] transition-all duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                      <div>
                                        <span className="text-[10px] font-mono uppercase opacity-50 block mb-1">{product.brand}</span>
                                        <h3 className="text-lg font-bold leading-tight">{product.name}</h3>
                                      </div>
                                      {product.price && <span className="text-sm font-mono font-bold">{product.price}</span>}
                                    </div>
                                    <p className="text-sm opacity-70 mb-6 flex-1">{product.description}</p>
                                    <a 
                                      href={product.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="mt-auto inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b border-current pb-1 w-fit group-hover:gap-4 transition-all"
                                    >
                                      View Product <ChevronRight className="w-3 h-3" />
                                    </a>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-full py-20 text-center border border-dashed border-[#141414]/20">
                                  <p className="text-sm font-mono opacity-40 italic">No specific products found for this compound.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : activeTab === 'comparison' ? (
                          <div className="animate-in fade-in duration-500">
                            <div className="mb-12">
                              <h2 className="text-4xl font-serif italic mb-2">Product Comparison</h2>
                              <p className="text-sm font-mono opacity-50 uppercase tracking-widest">Deep Analysis of Market Options</p>
                            </div>

                            {report.comparison ? (
                              <div className="space-y-12">
                                <section>
                                  <h3 className="text-[11px] font-mono uppercase opacity-50 mb-4 tracking-widest">Market Summary</h3>
                                  <p className="text-lg leading-relaxed">{report.comparison.summary}</p>
                                </section>

                                <section className="overflow-x-auto">
                                  <h3 className="text-[11px] font-mono uppercase opacity-50 mb-4 tracking-widest">Feature Matrix</h3>
                                  <table className="w-full border-collapse border border-[#141414]">
                                    <thead>
                                      <tr className="bg-[#141414] text-[#E4E3E0]">
                                        <th className="p-4 text-left text-xs uppercase font-bold border border-[#141414]">Feature</th>
                                        {Object.keys(report.comparison.comparisonTable[0] || {}).filter(k => k !== 'feature').map(brand => (
                                          <th key={brand} className="p-4 text-left text-xs uppercase font-bold border border-[#141414]">{brand}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {report.comparison.comparisonTable.map((row, i) => (
                                        <tr key={i} className="border border-[#141414]">
                                          <td className="p-4 text-xs font-bold border border-[#141414] bg-[#141414]/5">{row.feature}</td>
                                          {Object.keys(row).filter(k => k !== 'feature').map(brand => (
                                            <td key={brand} className="p-4 text-xs border border-[#141414]">{row[brand]}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </section>

                                <section className="bg-[#141414] text-[#E4E3E0] p-8">
                                  <h3 className="text-[11px] font-mono uppercase opacity-50 mb-4 tracking-widest">Clinical Verdict</h3>
                                  <p className="text-2xl font-serif italic">{report.comparison.verdict}</p>
                                </section>
                              </div>
                            ) : (
                              <div className="py-20 text-center border border-dashed border-[#141414]/20">
                                <p className="text-sm font-mono opacity-40 italic">No comparison data available.</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="animate-in fade-in duration-500">
                            <div className="mb-12">
                              <h2 className="text-4xl font-serif italic mb-2">Purity & Contaminant Analysis</h2>
                              <p className="text-sm font-mono opacity-50 uppercase tracking-widest">Heavy Metals, Recalls & Safety Alerts</p>
                            </div>

                            {report.purity ? (
                              <div className="space-y-12">
                                <section className="bg-amber-50 border-l-4 border-amber-500 p-6">
                                  <h3 className="text-[11px] font-mono uppercase text-amber-800 mb-2 tracking-widest">Category Risk Profile</h3>
                                  <p className="text-amber-900">{report.purity.generalRisks}</p>
                                </section>

                                <section>
                                  <h3 className="text-[11px] font-mono uppercase opacity-50 mb-4 tracking-widest">Specific Brand Alerts</h3>
                                  <div className="grid grid-cols-1 gap-4">
                                    {report.purity.alerts.length > 0 ? (
                                      report.purity.alerts.map((alert, i) => (
                                        <div key={i} className={cn(
                                          "p-4 border flex justify-between items-center",
                                          alert.status === 'recall' ? "bg-red-50 border-red-200" : 
                                          alert.status === 'warning' ? "bg-amber-50 border-amber-200" : 
                                          "bg-emerald-50 border-emerald-200"
                                        )}>
                                          <div>
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="font-bold text-sm">{alert.brand}</span>
                                              <span className={cn(
                                                "text-[8px] px-1.5 py-0.5 uppercase font-bold rounded-full",
                                                alert.status === 'recall' ? "bg-red-500 text-white" : 
                                                alert.status === 'warning' ? "bg-amber-500 text-white" : 
                                                "bg-emerald-500 text-white"
                                              )}>{alert.status}</span>
                                            </div>
                                            <p className="text-xs opacity-70">
                                              Detected: <span className="font-bold">{alert.contaminant}</span> ({alert.level})
                                            </p>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-[10px] font-mono font-bold">{alert.source}</div>
                                            <div className="text-[9px] opacity-50">{alert.date}</div>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="py-10 text-center border border-dashed border-[#141414]/10">
                                        <p className="text-sm font-mono opacity-30 italic">No specific brand alerts found in recent databases.</p>
                                      </div>
                                    )}
                                  </div>
                                </section>

                                <section>
                                  <h3 className="text-[11px] font-mono uppercase opacity-50 mb-4 tracking-widest">Purity Summary</h3>
                                  <p className="text-lg leading-relaxed">{report.purity.summary}</p>
                                </section>
                              </div>
                            ) : (
                              <div className="py-20 text-center border border-dashed border-[#141414]/20">
                                <p className="text-sm font-mono opacity-40 italic">Purity analysis not yet performed.</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-20 pt-8 border-t border-[#141414] flex justify-between items-center text-[10px] font-mono uppercase opacity-40">
                          <span>Bio-Compound Analyzer System</span>
                          <span>End of Report</span>
                          <span>Ref: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                        <Beaker className="w-24 h-24 mb-6" />
                        <h2 className="text-3xl font-serif italic">Ready for Analysis</h2>
                        <p className="text-sm font-mono uppercase tracking-widest mt-2">Enter a compound to begin the scientific pipeline</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </React.Fragment>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="border-t border-[#141414] p-3 bg-[#141414] text-[#E4E3E0] flex justify-between items-center text-[9px] font-mono uppercase tracking-[0.2em]">
        <div className="flex gap-6">
          <span className="flex items-center gap-1"><Info className="w-3 h-3" /> Medical Disclaimer: Research Use Only</span>
          <span>Not Medical Advice</span>
        </div>
        <div className="flex gap-4">
          <span>Engine: Gemini 3.1 Pro</span>
          <span>Status: Online</span>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #141414;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #333;
        }
      `}} />
    </div>
  );
}
