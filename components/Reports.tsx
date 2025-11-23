import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DailyLog } from '../types';
import { generateWeeklyReportSummary } from '../services/geminiService';

interface Props {
  logs: DailyLog[];
  onClose: () => void;
}

// Helper to render bold text from **text** format
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <p className="mb-4 leading-relaxed text-indigo-900/80">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-indigo-900 font-bold">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
};

export const Reports: React.FC<Props> = ({ logs, onClose }) => {
  const [summary, setSummary] = useState<string>("Analyzing your data to generate a professional report...");

  // Process data for charts
  const chartData = logs.slice(-7).map(log => {
    const totalCals = log.entries.reduce((acc, curr) => acc + curr.macros.calories, 0);
    return {
      date: new Date(log.date).toLocaleDateString(undefined, { weekday: 'short' }),
      calories: totalCals,
      weight: log.weight || null
    };
  });

  useEffect(() => {
    generateWeeklyReportSummary(logs.slice(-7)).then(setSummary);
  }, [logs]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 no-print">
          <h2 className="text-3xl font-bold text-gray-900">Performance Report</h2>
          <div className="flex space-x-4">
            <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium text-gray-700">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
              Export PDF
            </button>
            <button onClick={onClose} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-emerald-600 font-medium">
              Done
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="space-y-10 print:space-y-6">
          
          {/* AI Summary Section */}
          <section className="bg-gradient-to-br from-indigo-50 to-white p-8 rounded-3xl border border-indigo-100 shadow-sm">
            <h3 className="text-indigo-900 font-black text-xl mb-4 flex items-center tracking-tight">
               <span className="text-2xl mr-3">📊</span> COACH'S ANALYSIS
            </h3>
            <div className="prose prose-indigo max-w-none">
              {summary.split('\n').map((paragraph, idx) => (
                 paragraph.trim() ? <FormattedText key={idx} text={paragraph} /> : <div key={idx} className="h-2" />
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 break-inside-avoid">
            {/* Calorie Chart */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-gray-800 font-bold text-lg mb-6">Calorie Trends</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: '#f3f4f6' }}
                    />
                    <Bar dataKey="calories" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Weight Chart */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-gray-800 font-bold text-lg mb-6">Weight History</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.filter(d => d.weight !== null)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
        </div>
        
        <div className="text-center text-gray-400 text-sm mt-12 print-only">
           Generated by SlimLogic AI
        </div>
      </div>
    </div>
  );
};