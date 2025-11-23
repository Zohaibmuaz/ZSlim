import React, { useState, useRef } from 'react';
import { editFoodImage } from '../services/geminiService';

export const MealFixer: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setOriginalImage(base64);
        setEditedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!originalImage || !prompt) return;
    setLoading(true);
    try {
      const resultBase64 = await editFoodImage(originalImage, prompt);
      if (resultBase64) {
        setEditedImage(resultBase64);
      } else {
        alert("Could not generate edited image.");
      }
    } catch (e) {
      alert("Error editing image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-gray-800 mb-2 flex items-center">
           <span className="text-yellow-500 mr-2">✨</span> Meal Fixer
        </h2>
        <p className="text-gray-500">Visualize a healthier version. Tell the AI to "Remove the fries" or "Add a salad".</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Original */}
        <div 
          onClick={() => !originalImage && fileInputRef.current?.click()}
          className={`relative rounded-2xl overflow-hidden h-64 bg-gray-100 border-2 ${!originalImage ? 'border-dashed border-gray-300 cursor-pointer' : 'border-transparent'}`}
        >
           {originalImage ? (
             <img src={`data:image/jpeg;base64,${originalImage}`} className="w-full h-full object-cover" />
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span>Upload Meal</span>
             </div>
           )}
           <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />
           <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">Original</div>
        </div>

        {/* Result */}
        <div className="relative rounded-2xl overflow-hidden h-64 bg-gray-100 border-2 border-transparent">
           {editedImage ? (
             <img src={`data:image/jpeg;base64,${editedImage}`} className="w-full h-full object-cover" />
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-gray-400">
                {loading ? <span className="animate-pulse">Generating...</span> : <span>Edited Result</span>}
             </div>
           )}
           <div className="absolute top-2 left-2 bg-secondary/80 text-white text-xs px-2 py-1 rounded">AI Edit</div>
        </div>
      </div>

      <div className="flex gap-3">
        <input 
          type="text" 
          className="flex-1 border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
          placeholder="e.g. Replace the soda with water"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button 
          onClick={handleGenerate}
          disabled={loading || !originalImage || !prompt}
          className="bg-gray-900 text-white font-bold px-6 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          Magic
        </button>
      </div>
    </div>
  );
};