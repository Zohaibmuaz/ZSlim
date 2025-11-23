import React, { useState, useRef } from 'react';
import { suggestHealthyAlternative, generateFoodImage } from '../services/geminiService';
import { HealthyAlternativeResult } from '../types';

export const FoodAlternative: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<HealthyAlternativeResult | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setImage(base64);
        setResult(null);
        setGeneratedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setResult(null);
    setGeneratedImage(null);
    
    try {
      const logsStr = localStorage.getItem('slimlogic_logs');
      const context = logsStr ? "User tends to eat " + logsStr.slice(0, 200) : "New user";
      
      // 1. Get Text Suggestions
      const res = await suggestHealthyAlternative(image, context);
      setResult(res);
      setLoading(false);

      // 2. Generate Image of the Suggestion
      if (res.healthierAlternative) {
        setGeneratingImage(true);
        const genImg = await generateFoodImage(res.healthierAlternative);
        if (genImg) {
          setGeneratedImage(genImg);
        }
        setGeneratingImage(false);
      }

    } catch (e) {
      alert("Could not generate alternative.");
      setLoading(false);
      setGeneratingImage(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 pb-24">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-800 mb-2 flex items-center">
           <span className="text-purple-500 mr-2">🟣</span> Smart Swap
        </h2>
        <p className="text-gray-500">Craving something bad? Upload a photo and let AI suggest a healthier match (with a photo!).</p>
      </div>

      <div 
        onClick={() => !image && fileInputRef.current?.click()}
        className={`relative rounded-2xl overflow-hidden h-64 bg-gray-100 border-2 mb-6 ${!image ? 'border-dashed border-gray-300 cursor-pointer hover:bg-gray-50' : 'border-transparent'}`}
      >
           {image ? (
             <img src={`data:image/jpeg;base64,${image}`} className="w-full h-full object-cover" />
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="text-4xl mb-2">🍔</span>
                <span>Upload Craving</span>
             </div>
           )}
           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
           {image && (
             <button 
                onClick={(e) => { e.stopPropagation(); setImage(null); setResult(null); setGeneratedImage(null); }}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
             >
                ✕
             </button>
           )}
      </div>

      {!result ? (
          <button 
            onClick={handleAnalyze}
            disabled={!image || loading}
            className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-purple-700 disabled:opacity-50 transition-all flex items-center justify-center"
          >
            {loading ? (
                <>
                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                </>
            ) : "Find Healthier Alternative"}
          </button>
      ) : (
          <div className="bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden animate-fade-in">
              <div className="bg-purple-600 p-4 text-white">
                  <div className="text-xs opacity-75 uppercase font-bold tracking-wider">Instead of {result.originalFood}</div>
                  <div className="text-2xl font-black">Try {result.healthierAlternative}</div>
              </div>
              
              {/* Generated Image Section */}
              <div className="h-56 bg-gray-200 relative">
                 {generatingImage ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-sm animate-pulse">
                        Generating delicious preview...
                    </div>
                 ) : generatedImage ? (
                    <img src={`data:image/jpeg;base64,${generatedImage}`} className="w-full h-full object-cover" />
                 ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
                        Image Unavailable
                    </div>
                 )}
              </div>

              <div className="p-6">
                  <div className="flex items-center mb-4 text-green-600 bg-green-50 p-3 rounded-lg">
                      <span className="text-xl font-bold mr-2">🔥</span>
                      <span className="font-medium">Saves ~{result.calorieDifference} Calories</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed font-medium">{result.whyItIsBetter}</p>
              </div>
          </div>
      )}
    </div>
  );
};