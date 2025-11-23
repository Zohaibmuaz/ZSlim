import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onSubmit: (weight: number) => void;
  lastWeight?: number;
}

export const WeightCheckIn: React.FC<Props> = ({ isOpen, onSubmit, lastWeight }) => {
  const [weight, setWeight] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(weight);
    if (!isNaN(num)) {
      setIsSubmitting(true);
      // Small timeout not needed technically but good for UI feel
      onSubmit(num);
    }
  };

  const trend = lastWeight && !isNaN(parseFloat(weight)) 
    ? parseFloat(weight) - lastWeight 
    : 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all scale-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Daily Check-in</h2>
        <p className="text-gray-500 mb-6">Consistency is key. Enter your weight for today.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Weight (lbs)</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent text-lg font-mono font-medium"
              placeholder="e.g. 185.5"
              autoFocus
            />
          </div>

          {weight && lastWeight && (
            <div className={`p-3 rounded-lg flex items-center justify-center border ${trend <= 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
               <span className="font-bold text-lg mr-2">
                 {trend <= 0 ? '↓' : '↑'} {Math.abs(trend).toFixed(1)} lbs
               </span>
               <span className="text-sm">{trend <= 0 ? 'Great work!' : 'Keep going!'}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!weight || isSubmitting}
            className="w-full bg-primary hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
               <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              "Save Progress"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};