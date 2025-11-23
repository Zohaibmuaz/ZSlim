import React, { useState } from 'react';
import { DailyLog } from '../types';
import { analyzeDailyLog } from '../services/geminiService';

interface Props {
  logs: DailyLog[];
}

export const History: React.FC<Props> = ({ logs }) => {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState<string | null>(null);
  const [analyzedLogs, setAnalyzedLogs] = useState<DailyLog[]>(logs);

  const sortedLogs = [...analyzedLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleExpand = async (log: DailyLog) => {
    if (expandedDate === log.date) {
        setExpandedDate(null);
        return;
    }
    setExpandedDate(log.date);

    // If no analysis exists, generate it
    if (!log.analysis && log.entries.length > 0) {
        setLoadingAnalysis(log.date);
        const analysis = await analyzeDailyLog(log);
        
        // Update local state to cache analysis
        const newLogs = analyzedLogs.map(l => l.date === log.date ? { ...l, analysis } : l);
        setAnalyzedLogs(newLogs);
        setLoadingAnalysis(null);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 pb-24">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Day by Day Tracker</h2>
      
      <div className="space-y-4">
        {sortedLogs.map(log => {
            const totalCals = log.entries.reduce((sum, e) => sum + e.macros.calories, 0);
            const isExpanded = expandedDate === log.date;
            
            return (
                <div key={log.date} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div 
                        onClick={() => handleExpand(log)}
                        className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                        <div>
                            <div className="font-bold text-gray-800">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                            <div className="text-xs text-gray-500">{log.entries.length} meals • {log.weight ? `${log.weight} lbs` : 'No weight'}</div>
                        </div>
                        <div className={`text-lg font-mono font-bold ${totalCals > 2000 ? 'text-red-500' : 'text-emerald-600'}`}>
                            {totalCals} <span className="text-xs text-gray-400 font-sans font-normal">cals</span>
                        </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                        <div className="border-t border-gray-100 p-4 bg-gray-50">
                            {/* Analysis Section */}
                            {loadingAnalysis === log.date ? (
                                <div className="text-center py-4 text-gray-500 animate-pulse">Consulting AI Analysis...</div>
                            ) : log.analysis ? (
                                <div className="mb-6 bg-white p-4 rounded-lg border border-gray-100">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-bold text-gray-700">Daily Verdict</h4>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            log.analysis.verdict === 'Good Day' ? 'bg-green-100 text-green-800' : 
                                            log.analysis.verdict === 'Off Track' ? 'bg-red-100 text-red-800' : 
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>{log.analysis.verdict}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-3">{log.analysis.summary}</p>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="text-xs">
                                            <div className="font-bold text-green-600 mb-1">DO</div>
                                            <ul className="list-disc list-inside text-gray-500">
                                                {log.analysis.dos.map((d, i) => <li key={i}>{d}</li>)}
                                            </ul>
                                        </div>
                                        <div className="text-xs">
                                            <div className="font-bold text-red-500 mb-1">DON'T</div>
                                            <ul className="list-disc list-inside text-gray-500">
                                                {log.analysis.donts.map((d, i) => <li key={i}>{d}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-sm text-gray-400 mb-4">No analysis available</div>
                            )}

                            {/* Food List */}
                            <div className="space-y-2">
                                {log.entries.map(entry => (
                                    <div key={entry.id} className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                                        <span className="text-gray-700">{entry.name}</span>
                                        <span className="font-mono text-gray-500">{entry.macros.calories}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};