import React from 'react';
import { FoodEntry } from '../types';

interface Props {
  entry: FoodEntry | null;
  onClose: () => void;
}

export const FoodDetailModal: React.FC<Props> = ({ entry, onClose }) => {
  if (!entry) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        {entry.imageUri && (
          <div className="h-48 w-full bg-gray-200">
            <img src={entry.imageUri} alt={entry.name} className="w-full h-full object-cover" />
          </div>
        )}
        
        <div className="p-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{entry.name}</h3>
          <div className="text-gray-500 text-sm mb-4">{new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>

          <div className="grid grid-cols-2 gap-3 mb-6">
             <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <div className="text-gray-500 text-xs uppercase font-bold">Calories</div>
                <div className="text-lg font-mono font-bold">{entry.macros.calories}</div>
             </div>
             <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <div className="text-gray-500 text-xs uppercase font-bold">Protein</div>
                <div className="text-lg font-mono font-bold">{entry.macros.protein}g</div>
             </div>
             <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <div className="text-gray-500 text-xs uppercase font-bold">Sat. Fat</div>
                <div className="text-lg font-mono font-bold text-red-600">{entry.macros.saturatedFats}g</div>
             </div>
             <div className="bg-slate-50 p-2 rounded border border-slate-100">
                <div className="text-gray-500 text-xs uppercase font-bold">Sugars</div>
                <div className="text-lg font-mono font-bold text-red-600">{entry.macros.sugars}g</div>
             </div>
          </div>

          <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-r-lg">
            <h4 className="text-emerald-800 font-bold text-sm mb-1">THE VERDICT</h4>
            <p className="text-emerald-700 italic text-sm">"{entry.verdict || 'Processing...'}"</p>
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-3 text-right">
          <button onClick={onClose} className="text-gray-600 font-medium hover:text-gray-900">Close</button>
        </div>
      </div>
    </div>
  );
};