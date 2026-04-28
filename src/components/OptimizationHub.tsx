import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Zap, ChevronRight, ArrowLeft, Activity, Brain, ShieldCheck, Microscope, User, Upload, FileText, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { OptimizationResult } from '../types';
import { BioResearchService } from '../services/bioResearchService';

interface UserProfile {
  age: string;
  gender: string;
  issues: string;
  medicalHistory: string;
  historyFile?: File | null;
}

interface QuestionnaireProps {
  category: 'Sleep' | 'Digestion';
  onComplete: (answers: Record<string, string>) => void;
  onBack: () => void;
}

const SleepQuestions = [
  { id: 'hours', label: 'Average sleep duration', type: 'select', options: ['< 5 hours', '5-6 hours', '6-7 hours', '7-8 hours', '8+ hours'] },
  { id: 'issue', label: 'Primary sleep challenge', type: 'select', options: ['Falling asleep', 'Staying asleep', 'Waking up tired', 'None'] },
  { id: 'goal', label: 'Primary goal', type: 'text', placeholder: 'e.g., Increase REM sleep, reduce night waking' },
  { id: 'tracking', label: 'Do you use a tracker?', type: 'select', options: ['Oura', 'Whoop', 'Apple Watch', 'Other', 'None'] },
];

const DigestionQuestions = [
  { id: 'frequency', label: 'Frequency of discomfort', type: 'select', options: ['Daily', 'Weekly', 'Occasionally', 'Rarely'] },
  { id: 'goal', label: 'Primary goal', type: 'text', placeholder: 'e.g., Fix bloating, improve microbiome' },
  { id: 'triggers', label: 'Known food triggers', type: 'text', placeholder: 'e.g., Dairy, gluten, legumes' },
  { id: 'current', label: 'Current supplements', type: 'text', placeholder: 'e.g., Probiotics, enzymes' },
];

const Questionnaire: React.FC<QuestionnaireProps> = ({ category, onComplete, onBack }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const questions = category === 'Sleep' ? SleepQuestions : DigestionQuestions;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(answers);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto"
    >
      <button onClick={onBack} className="flex items-center gap-2 text-xs font-mono uppercase opacity-50 hover:opacity-100 mb-8 transition-all">
        <ArrowLeft className="w-3 h-3" /> Back to Hub
      </button>

      <div className="mb-12">
        <h2 className="text-5xl font-serif italic mb-2">{category} Optimization</h2>
        <p className="text-sm font-mono opacity-50 uppercase tracking-widest">Initial Assessment Questionnaire</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {questions.map((q) => (
          <div key={q.id} className="space-y-3">
            <label className="text-[11px] font-mono uppercase opacity-50 tracking-widest block">{q.label}</label>
            {q.type === 'select' ? (
              <select 
                required
                className="w-full bg-transparent border-b border-[#141414] py-3 text-lg focus:outline-none focus:border-opacity-100 transition-all"
                onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              >
                <option value="">Select an option</option>
                {q.options?.map(opt => <option key={opt} value={opt} className="text-black">{opt}</option>)}
              </select>
            ) : (
              <input 
                required
                type="text"
                placeholder={q.placeholder}
                className="w-full bg-transparent border-b border-[#141414] py-3 text-lg placeholder:opacity-20 focus:outline-none focus:border-opacity-100 transition-all"
                onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
              />
            )}
          </div>
        ))}

        <button 
          type="submit"
          className="w-full bg-[#141414] text-[#E4E3E0] py-6 text-xs font-bold uppercase tracking-[0.3em] hover:bg-[#141414]/90 transition-all"
        >
          Initialize Specialized Agents
        </button>
      </form>
    </motion.div>
  );
};

interface OptimizationHubProps {
  onTriggerResearch?: (compound: string, biomarkers?: string) => void;
}

export const OptimizationHub: React.FC<OptimizationHubProps> = ({ onTriggerResearch }) => {
  const [view, setView] = useState<'hub' | 'questionnaire' | 'results' | 'profile'>('hub');
  const [category, setCategory] = useState<'Sleep' | 'Digestion'>('Sleep');
  const [isResearching, setIsResearching] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [results, setResults] = useState<OptimizationResult | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    age: '',
    gender: '',
    issues: '',
    medicalHistory: ''
  });
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);
  
  const service = new BioResearchService();

  const handleDeepDive = (compoundName: string) => {
    if (onTriggerResearch) {
      const biomarkersContext = `Age: ${userProfile.age}, Gender: ${userProfile.gender}. Primary Issues: ${userProfile.issues}. Medical History: ${userProfile.medicalHistory}`;
      onTriggerResearch(compoundName, biomarkersContext);
    }
  };

  const handleStartResearch = async (answers: Record<string, string>) => {
    if (userProfile.historyFile) {
      setIsProcessingFile(true);
      setView('results');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsProcessingFile(false);
    }
    
    setIsResearching(true);
    if (!userProfile.historyFile) setView('results');
    try {
      // Combine profile with specific answers
      const combinedInfo = {
        ...answers,
        user_age: userProfile.age,
        user_gender: userProfile.gender,
        user_issues: userProfile.issues,
        user_medical_history: userProfile.medicalHistory + (userProfile.historyFile ? ` [File Attached: ${userProfile.historyFile.name}]` : '')
      };
      const data = await service.runOptimizationResearch(category, combinedInfo);
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResearching(false);
    }
  };

  const isProfileComplete = userProfile.age && userProfile.gender;

  const ProfileForm = () => (
    <div className="space-y-6 bg-white border border-[#141414] p-8">
      <div className="flex items-center gap-3 mb-6 border-b border-[#141414]/10 pb-4">
        <User className="w-5 h-5" />
        <h3 className="text-xl font-serif italic">Patient Profile</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-mono uppercase opacity-50 block">Age</label>
          <input 
            type="number"
            value={userProfile.age}
            onChange={(e) => setUserProfile(prev => ({ ...prev, age: e.target.value }))}
            className="w-full bg-transparent border-b border-[#141414] py-2 focus:outline-none"
            placeholder="e.g. 34"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-mono uppercase opacity-50 block">Gender</label>
          <select 
            value={userProfile.gender}
            onChange={(e) => setUserProfile(prev => ({ ...prev, gender: e.target.value }))}
            className="w-full bg-transparent border-b border-[#141414] py-2 focus:outline-none"
          >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase opacity-50 block">Primary Concerns / Issues</label>
        <textarea 
          value={userProfile.issues}
          onChange={(e) => setUserProfile(prev => ({ ...prev, issues: e.target.value }))}
          className="w-full bg-transparent border border-[#141414] p-3 text-sm min-h-[80px] focus:outline-none"
          placeholder="List any acute or chronic symptoms..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase opacity-50 block">Past Medical History</label>
        <textarea 
          value={userProfile.medicalHistory}
          onChange={(e) => setUserProfile(prev => ({ ...prev, medicalHistory: e.target.value }))}
          className="w-full bg-transparent border border-[#141414] p-3 text-sm min-h-[80px] focus:outline-none"
          placeholder="Previous diagnoses, surgeries, medications..."
        />
      </div>

      <div className="pt-4">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#141414]/20 cursor-pointer hover:bg-[#141414]/5 transition-all">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-6 h-6 mb-3 opacity-30" />
            <p className="text-[10px] font-mono uppercase opacity-50">
              {userProfile.historyFile ? userProfile.historyFile.name : "Upload medical records (PDF/Image)"}
            </p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept=".pdf,image/*"
            onChange={(e) => setUserProfile(prev => ({ ...prev, historyFile: e.target.files ? e.target.files[0] : null }))}
          />
        </label>
        {userProfile.historyFile && (
          <button 
            onClick={() => setUserProfile(prev => ({ ...prev, historyFile: null }))}
            className="mt-2 text-[9px] font-mono uppercase text-red-600 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Remove File
          </button>
        )}
      </div>
    </div>
  );

  if (view === 'questionnaire') {
    return <Questionnaire category={category} onBack={() => setView('hub')} onComplete={handleStartResearch} />;
  }

  if (view === 'results') {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setView('hub')} className="flex items-center gap-2 text-xs font-mono uppercase opacity-50 hover:opacity-100 mb-8 transition-all">
          <ArrowLeft className="w-3 h-3" /> New Assessment
        </button>

        {isProcessingFile ? (
          <div className="py-40 text-center animate-in fade-in duration-500">
            <div className="relative w-16 h-16 mx-auto mb-8">
              <FileText className="w-16 h-16 opacity-20" />
              <motion.div 
                animate={{ y: [0, 64, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-0 left-0 w-full h-0.5 bg-[#141414]"
              />
            </div>
            <h2 className="text-2xl font-serif italic mb-2">Intelligence Agent Active</h2>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40">Analyzing medical records & extracting biomarkers...</p>
          </div>
        ) : isResearching ? (
          <div className="py-40 text-center">
            <Microscope className="w-12 h-12 mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl font-serif italic mb-2">Specialized Agents Active</h2>
            <p className="text-xs font-mono uppercase tracking-[0.2em] opacity-40">Consulting Circadian & Microbiome Databases...</p>
          </div>
        ) : results ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-16 border-b border-[#141414] pb-8">
              <h2 className="text-6xl font-serif italic mb-4">{results.category} Protocol</h2>
              <p className="text-lg leading-relaxed opacity-70">{results.summary}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-12">
                <section>
                  <h3 className="text-[11px] font-mono uppercase opacity-40 mb-6 tracking-widest">Core Interventions</h3>
                  <div className="space-y-6">
                    {results.recommendations.map((rec, i) => (
                      <div key={i} className="border border-[#141414] p-8 group hover:bg-[#141414] hover:text-[#E4E3E0] transition-all duration-500">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-xl font-bold">{rec.title}</h4>
                          <span className={cn(
                            "text-[9px] px-2 py-1 uppercase font-bold border",
                            rec.evidenceLevel === 'high' ? "border-emerald-500 text-emerald-500" : 
                            rec.evidenceLevel === 'medium' ? "border-amber-500 text-amber-500" : 
                            "border-red-500 text-red-500"
                          )}>
                            {rec.evidenceLevel} Evidence
                          </span>
                        </div>
                        <p className="text-sm opacity-70 mb-6">{rec.description}</p>
                        <div className="pt-4 border-t border-current/10">
                          <span className="text-[10px] font-mono uppercase opacity-50 block mb-1">Biological Mechanism</span>
                          <p className="text-xs italic">{rec.mechanism}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-12">
                <section className="bg-[#141414] text-[#E4E3E0] p-8">
                  <h3 className="text-[11px] font-mono uppercase opacity-50 mb-6 tracking-widest">Lifestyle Shift</h3>
                  <ul className="space-y-4">
                    {results.lifestyleChanges.map((change, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <Zap className="w-4 h-4 shrink-0 text-amber-400" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="border border-[#141414] p-8">
                  <h3 className="text-[11px] font-mono uppercase opacity-50 mb-6 tracking-widest">Suggested Compounds</h3>
                  <div className="space-y-3">
                    {results.suggestedCompounds.map((compound, i) => (
                      <div 
                        key={i} 
                        onClick={() => handleDeepDive(compound)}
                        className="flex items-center justify-between group cursor-pointer"
                      >
                        <span className="text-sm font-bold border-b border-transparent group-hover:border-[#141414] transition-all">{compound}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all text-[10px] font-mono uppercase tracking-widest">
                          Deep Dive <ChevronRight size={10} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-8 text-[10px] font-mono opacity-40 leading-relaxed">
                    * Click any compound to initiate a specialized multi-agent research deep-dive into scientific literature and purity data.
                  </p>
                </section>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-20 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h2 className="text-7xl font-serif italic mb-4">Optimization Hub</h2>
          <p className="text-sm font-mono opacity-50 uppercase tracking-[0.3em]">Specialized Bio-Optimization Pipelines</p>
        </div>
        
        <button 
          onClick={() => setShowProfileOverlay(!showProfileOverlay)}
          className={cn(
            "flex items-center gap-3 px-6 py-3 border transition-all text-xs font-mono uppercase tracking-widest",
            isProfileComplete ? "border-emerald-500 text-emerald-600" : "border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]"
          )}
        >
          <User className="w-4 h-4" />
          {isProfileComplete ? "Profile Complete" : "Complete Profile First"}
        </button>
      </div>

      <AnimatePresence>
        {showProfileOverlay && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-12 overflow-hidden"
          >
            <ProfileForm />
          </motion.div>
        )}
      </AnimatePresence>

      {!isProfileComplete && (
        <div className="mb-12 p-12 bg-amber-50 border border-amber-200 flex flex-col items-center text-center">
          <FileText className="w-12 h-12 mb-4 text-amber-600 opacity-50" />
          <h3 className="text-xl font-serif italic mb-2">Initial Setup Required</h3>
          <p className="text-sm opacity-60 mb-6 max-w-md">To provide accurate optimization protocols, our agents require your baseline biological profile and medical history.</p>
          <button 
            onClick={() => setShowProfileOverlay(true)}
            className="px-8 py-3 bg-[#141414] text-[#E4E3E0] text-xs font-bold uppercase tracking-widest"
          >
            Configure Profile
          </button>
        </div>
      )}

      <div className={cn(
        "grid grid-cols-1 md:grid-cols-2 gap-8 transition-all",
        !isProfileComplete && "opacity-20 pointer-events-none grayscale"
      )}>
        <div 
          onClick={() => { setCategory('Sleep'); setView('questionnaire'); }}
          className="group relative border border-[#141414] p-12 cursor-pointer overflow-hidden transition-all duration-500 hover:bg-[#141414] hover:text-[#E4E3E0]"
        >
          <Moon className="w-12 h-12 mb-8 transition-transform duration-500 group-hover:scale-110" />
          <h3 className="text-3xl font-serif italic mb-4">Sleep Optimization</h3>
          <p className="text-sm opacity-60 mb-8 max-w-xs">
            Consult Circadian Biologists and Sleep Specialists to master your recovery cycles and deep sleep architecture.
          </p>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b border-current pb-1 w-fit group-hover:gap-4 transition-all">
            Start Assessment <ChevronRight className="w-3 h-3" />
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-32 h-32 rotate-12" />
          </div>
        </div>

        <div 
          onClick={() => { setCategory('Digestion'); setView('questionnaire'); }}
          className="group relative border border-[#141414] p-12 cursor-pointer overflow-hidden transition-all duration-500 hover:bg-[#141414] hover:text-[#E4E3E0]"
        >
          <Microscope className="w-12 h-12 mb-8 transition-transform duration-500 group-hover:scale-110" />
          <h3 className="text-3xl font-serif italic mb-4">Gut & Digestion</h3>
          <p className="text-sm opacity-60 mb-8 max-w-xs">
            Consult Microbiome Researchers and Gastroenterology agents to optimize nutrient absorption and gut-brain axis health.
          </p>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b border-current pb-1 w-fit group-hover:gap-4 transition-all">
            Start Assessment <ChevronRight className="w-3 h-3" />
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Brain className="w-32 h-32 -rotate-12" />
          </div>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 border border-dashed border-[#141414]/20 opacity-40">
          <ShieldCheck className="w-6 h-6 mb-4" />
          <h4 className="text-xs font-bold uppercase tracking-widest mb-2">Evidence First</h4>
          <p className="text-[10px] leading-relaxed">All recommendations are vetted against the latest clinical literature by specialized sub-agents.</p>
        </div>
        <div className="p-8 border border-dashed border-[#141414]/20 opacity-40">
          <Microscope className="w-6 h-6 mb-4" />
          <h4 className="text-xs font-bold uppercase tracking-widest mb-2">Agent Collaboration</h4>
          <p className="text-[10px] leading-relaxed">Multiple AI agents collaborate to find synergies between lifestyle and supplementation.</p>
        </div>
        <div className="p-8 border border-dashed border-[#141414]/20 opacity-40">
          <Activity className="w-6 h-6 mb-4" />
          <h4 className="text-xs font-bold uppercase tracking-widest mb-2">Dynamic Protocols</h4>
          <p className="text-[10px] leading-relaxed">Protocols evolve as new research is published and indexed by our discovery engine.</p>
        </div>
      </div>
    </div>
  );
};
