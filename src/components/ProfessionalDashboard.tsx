import React, { useState } from 'react';
import { 
  Users, 
  LineChart as ChartIcon, 
  BookOpen, 
  ClipboardList, 
  TrendingUp, 
  AlertCircle,
  Plus,
  ArrowUpRight,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

// Mock Data for Professional Dashboard
const COHORTS = [
  { id: 'c1', name: 'Longevity Study Group A', members: 24, status: 'Active', avgBioAgeDelta: -2.4 },
  { id: 'c2', name: 'High Performance Athletes', members: 12, status: 'Active', avgBioAgeDelta: -1.8 },
  { id: 'c3', name: 'Metabolic Health Cohort', members: 45, status: 'Review', avgBioAgeDelta: -0.5 },
];

const BIOMARKER_TRENDS = [
  { month: 'Jan', hrv: 62, crp: 1.2, bioAge: 42.5 },
  { month: 'Feb', hrv: 65, crp: 1.1, bioAge: 42.1 },
  { month: 'Mar', hrv: 68, crp: 0.9, bioAge: 41.8 },
  { month: 'Apr', hrv: 66, crp: 1.0, bioAge: 41.9 },
  { month: 'May', hrv: 72, crp: 0.8, bioAge: 41.5 },
  { month: 'Jun', hrv: 75, crp: 0.7, bioAge: 41.2 },
];

const RESEARCH_FEED = [
  { id: 1, title: 'NAD+ Precursors and Mitochondrial Biogenesis in Skeletal Muscle', journal: 'Nature Aging', date: '2026-03-10' },
  { id: 2, title: 'Impact of Intermittent Fasting on Autophagy and Longevity Pathways', journal: 'Cell Metabolism', date: '2026-03-05' },
  { id: 3, title: 'Senolytic Therapies: A Review of Current Clinical Trials', journal: 'The Lancet Longevity', date: '2026-02-28' },
];

const PROTOCOLS = [
  { id: 'p1', name: 'Mitochondrial Optimization v4', assigned: 18, success: '85%' },
  { id: 'p2', name: 'Circadian Reset Protocol', assigned: 32, success: '92%' },
  { id: 'p3', name: 'Gut Barrier Repair (Advanced)', assigned: 12, success: '78%' },
];

const STATS = [
  { label: 'Total Managed Clients', value: '81', trend: '+12%', icon: Users },
  { label: 'Avg. Bio-Age Reduction', value: '-1.8y', trend: '-0.4y', icon: TrendingUp },
  { label: 'Active Research Projects', value: '4', trend: 'On Track', icon: BookOpen },
  { label: 'Critical Alerts', value: '2', trend: 'Action Needed', icon: AlertCircle, color: 'text-red-600' },
];

export const ProfessionalDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'cohorts' | 'research' | 'protocols'>('overview');

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-serif italic mb-1">Professional Dashboard</h2>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-50">Longevity Researcher & Health Coach Interface</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase tracking-widest hover:bg-opacity-90 transition-all">
            <Plus size={14} />
            New Cohort
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-[#141414] text-[10px] font-mono uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-all">
            Export Data
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#141414]/10">
        {[
          { id: 'overview', label: 'Overview', icon: <TrendingUp size={14} /> },
          { id: 'cohorts', label: 'Cohorts & Clients', icon: <Users size={14} /> },
          { id: 'research', label: 'Research Feed', icon: <BookOpen size={14} /> },
          { id: 'protocols', label: 'Protocol Builder', icon: <ClipboardList size={14} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-4 text-[10px] font-mono uppercase tracking-widest transition-all border-b-2",
              activeTab === tab.id ? "border-[#141414] opacity-100" : "border-transparent opacity-40 hover:opacity-100"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {activeTab === 'overview' && (
          <>
            {/* Stats Overview */}
            <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
              {STATS.map((stat, i) => (
                <div key={i} className="p-6 border border-[#141414] bg-white">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 border border-[#141414]/10 opacity-40">
                      <stat.icon size={16} />
                    </div>
                    <span className={cn("text-[10px] font-mono font-bold", stat.color || "text-emerald-600")}>{stat.trend}</span>
                  </div>
                  <div className="text-3xl font-serif italic mb-1">{stat.value}</div>
                  <div className="text-[9px] font-mono uppercase tracking-widest opacity-40">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Main Charts */}
            <div className="lg:col-span-8 space-y-8">
              <div className="p-8 border border-[#141414] bg-white">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-serif italic">Aggregate Biomarker Trends</h3>
                  <div className="flex gap-4 text-[9px] font-mono uppercase opacity-40">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-indigo-500" /> HRV</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500" /> CRP</div>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={BIOMARKER_TRENDS}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#14141410" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#141414', border: 'none', color: '#E4E3E0', fontSize: '10px', fontFamily: 'monospace' }}
                        itemStyle={{ color: '#E4E3E0' }}
                      />
                      <Line type="monotone" dataKey="hrv" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="crp" stroke="#f43f5e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 border border-[#141414] bg-white">
                  <h3 className="text-lg font-serif italic mb-6">Cohort Bio-Age Impact</h3>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={COHORTS}>
                        <XAxis dataKey="id" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                        <Tooltip 
                          cursor={{ fill: '#14141405' }}
                          contentStyle={{ backgroundColor: '#141414', border: 'none', color: '#E4E3E0', fontSize: '10px', fontFamily: 'monospace' }}
                        />
                        <Bar dataKey="avgBioAgeDelta" fill="#141414">
                          {COHORTS.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.avgBioAgeDelta < -1 ? '#059669' : '#141414'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="p-6 border border-[#141414] bg-white">
                  <h3 className="text-lg font-serif italic mb-6">Recent Alerts</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 p-3 bg-red-50 border-l-4 border-red-600">
                      <AlertCircle className="text-red-600 shrink-0" size={16} />
                      <div>
                        <div className="text-[10px] font-bold uppercase mb-1">Critical CRP Spike</div>
                        <p className="text-[11px] opacity-70">Subject #829 (Cohort A) showed 3.4 mg/L CRP. Review protocol immediately.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-3 bg-amber-50 border-l-4 border-amber-600">
                      <AlertCircle className="text-amber-600 shrink-0" size={16} />
                      <div>
                        <div className="text-[10px] font-bold uppercase mb-1">Low Compliance</div>
                        <p className="text-[11px] opacity-70">Metabolic Cohort tracking compliance dropped to 64% this week.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="lg:col-span-4 space-y-8">
              <div className="p-6 border border-[#141414] bg-[#141414] text-[#E4E3E0]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-serif italic">Latest Research</h3>
                  <BookOpen size={16} className="opacity-40" />
                </div>
                <div className="space-y-6">
                  {RESEARCH_FEED.map((item) => (
                    <div key={item.id} className="group cursor-pointer">
                      <div className="text-[9px] font-mono uppercase tracking-widest opacity-40 mb-1">{item.journal} • {item.date}</div>
                      <h4 className="text-xs font-bold leading-tight group-hover:underline">{item.title}</h4>
                      <div className="mt-2 flex items-center gap-1 text-[9px] font-mono uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                        Read Paper <ArrowUpRight size={10} />
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-8 py-3 border border-[#E4E3E0]/20 text-[9px] font-mono uppercase tracking-widest hover:bg-[#E4E3E0] hover:text-[#141414] transition-all">
                  View Full Library
                </button>
              </div>

              <div className="p-6 border border-[#141414] bg-white">
                <h3 className="text-lg font-serif italic mb-6">Active Protocols</h3>
                <div className="space-y-4">
                  {PROTOCOLS.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 border border-[#141414]/5">
                      <div>
                        <div className="text-xs font-bold">{p.name}</div>
                        <div className="text-[9px] font-mono uppercase opacity-40">{p.assigned} Clients Assigned</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-emerald-600">{p.success}</div>
                        <div className="text-[9px] font-mono uppercase opacity-40">Success</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'cohorts' && (
          <div className="lg:col-span-12 space-y-6">
            <div className="flex justify-between items-center">
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" />
                <input 
                  type="text"
                  placeholder="Search clients or cohorts..."
                  className="w-full bg-transparent border border-[#141414] py-3 pl-10 pr-4 text-xs font-mono focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button className="p-3 border border-[#141414] hover:bg-[#141414]/5"><Filter size={16} /></button>
                <button className="px-6 py-3 bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase tracking-widest">Add Client</button>
              </div>
            </div>

            <div className="border border-[#141414] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase tracking-widest">
                    <th className="p-4 font-normal">Cohort Name</th>
                    <th className="p-4 font-normal">Members</th>
                    <th className="p-4 font-normal">Avg. Bio-Age Delta</th>
                    <th className="p-4 font-normal">Status</th>
                    <th className="p-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {COHORTS.map((c) => (
                    <tr key={c.id} className="border-b border-[#141414]/10 hover:bg-[#141414]/5 transition-colors">
                      <td className="p-4 font-bold">{c.name}</td>
                      <td className="p-4">{c.members}</td>
                      <td className="p-4 font-mono text-emerald-600">{c.avgBioAgeDelta}y</td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2 py-1 text-[9px] font-mono uppercase tracking-widest border",
                          c.status === 'Active' ? "border-emerald-600 text-emerald-600" : "border-amber-600 text-amber-600"
                        )}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button className="p-2 hover:bg-[#141414]/10 rounded-full"><MoreVertical size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'research' && (
          <div className="lg:col-span-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {RESEARCH_FEED.map((item) => (
                <div key={item.id} className="p-8 border border-[#141414] bg-white hover:shadow-xl transition-all group">
                  <div className="text-[10px] font-mono uppercase tracking-widest opacity-40 mb-4">{item.journal}</div>
                  <h3 className="text-2xl font-serif italic mb-6 leading-tight">{item.title}</h3>
                  <p className="text-xs opacity-60 mb-8 line-clamp-3">
                    Recent findings suggest a significant correlation between specific mitochondrial precursors and the upregulation of longevity-associated genes in human clinical trials...
                  </p>
                  <div className="flex justify-between items-center pt-6 border-t border-[#141414]/10">
                    <span className="text-[9px] font-mono uppercase opacity-40">{item.date}</span>
                    <button className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest font-bold group-hover:underline">
                      Analyze Paper <ArrowUpRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'protocols' && (
          <div className="lg:col-span-12 flex flex-col items-center justify-center py-20 border border-dashed border-[#141414]/20">
            <ClipboardList size={48} className="opacity-10 mb-6" />
            <h3 className="text-2xl font-serif italic mb-2">Protocol Builder</h3>
            <p className="text-sm opacity-40 mb-8">Design clinical-grade health protocols for your clients.</p>
            <button className="px-8 py-4 bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase tracking-widest hover:scale-105 transition-transform">
              Create New Template
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
