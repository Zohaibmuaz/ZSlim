import React, { useState, useRef, useEffect } from 'react';
import { assessFoodInput, getFoodVerdict } from '../services/geminiService';
import { FoodEntry, FoodAssessment, MacroNutrients } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (entry: FoodEntry) => void;
}

export const AddFoodModal: React.FC<Props> = ({ isOpen, onClose, onAdd }) => {
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<{q: string[], a: string[]} | null>(null);
  const [assessment, setAssessment] = useState<FoodAssessment | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setInput('');
      setImage(null);
      setConversation(null);
      setAssessment(null);
      setLoading(false);
    }
  }, [isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove header for API
        const cleanBase64 = base64.split(',')[1];
        setImage(cleanBase64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!input && !image) return;
    setLoading(true);

    try {
      // Prepare context from conversation history
      const prevQ = conversation?.q;
      const prevA = conversation?.a;
      
      // If this is a reply to questions, append current input to answers
      let currentAnswers = prevA ? [...prevA] : [];
      if (prevQ && prevQ.length > 0 && input) {
        currentAnswers.push(input);
      }

      const result = await assessFoodInput(
        // If we have a conversation, the initial input is less relevant than the context, 
        // but we keep the "main" description or image active.
        conversation ? "Answering clarifying questions" : input,
        image || undefined,
        prevQ,
        currentAnswers
      );

      setAssessment(result);

      if (!result.isSpecific && result.clarifyingQuestions) {
        // Update conversation state to show questions
        setConversation({
          q: result.clarifyingQuestions,
          a: currentAnswers
        });
        setInput(''); // Clear input for user to answer next
      }

    } catch (error) {
      alert("Failed to analyze food. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateId = () => {
    // Native Browser ID Generation
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleConfirm = async () => {
    if (!assessment?.estimatedMacros || !assessment.foodName) return;

    setLoading(true);
    // Generate Verdict
    const verdict = await getFoodVerdict(assessment.foodName, assessment.estimatedMacros);

    const newEntry: FoodEntry = {
      id: generateId(),
      name: assessment.foodName,
      timestamp: Date.now(),
      macros: assessment.estimatedMacros,
      verdict,
      imageUri: image ? `data:image/jpeg;base64,${image}` : undefined
    };

    onAdd(newEntry);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white w-full max-w-lg h-[90vh] sm:h-auto sm:rounded-2xl flex flex-col shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-lg text-gray-800">Log Food</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          
          {/* Assessment Success State */}
          {assessment?.isSpecific && assessment.estimatedMacros ? (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">🎯</span>
                  <h4 className="font-bold text-emerald-800">Precision Achieved</h4>
                </div>
                <p className="text-sm text-emerald-700">Identified: {assessment.foodName}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-gray-900">{assessment.estimatedMacros.calories}</div>
                  <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Calories</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                   <div className="text-xl font-bold text-gray-900">{assessment.estimatedMacros.protein}g</div>
                   <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Protein</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                   <div className="text-xl font-bold text-gray-900">{assessment.estimatedMacros.carbs}g</div>
                   <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Carbs</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl text-center">
                   <div className="text-xl font-bold text-gray-900">{assessment.estimatedMacros.fats}g</div>
                   <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Fats</div>
                </div>
              </div>

              <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex justify-between text-sm text-red-800">
                 <span>Sat. Fat: {assessment.estimatedMacros.saturatedFats}g</span>
                 <span>Sugars: {assessment.estimatedMacros.sugars}g</span>
              </div>

              <button 
                onClick={handleConfirm}
                className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:bg-emerald-600 transition-all"
              >
                Confirm & Log
              </button>
            </div>
          ) : (
            /* Input / Interrogation State */
            <div className="space-y-4">
              {/* Clarifying Questions */}
              {conversation?.q && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-4">
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">🤔</span>
                    <div>
                      <p className="font-semibold text-blue-900 mb-2">I need more detail for precision:</p>
                      <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                        {conversation.q.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {!image && !conversation && (
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors"
                 >
                   <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                   <span>Tap to upload food photo</span>
                   <input 
                     type="file" 
                     ref={fileInputRef} 
                     className="hidden" 
                     accept="image/*" 
                     onChange={handleImageUpload}
                   />
                 </div>
              )}

              {image && (
                <div className="relative rounded-xl overflow-hidden h-48 w-full bg-black">
                  <img src={`data:image/jpeg;base64,${image}`} className="w-full h-full object-cover opacity-80" />
                  <button 
                    onClick={() => { setImage(null); setConversation(null); }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {conversation ? "Your Answer" : "Or describe your meal"}
                </label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent"
                  rows={3}
                  placeholder={conversation ? "e.g. Grilled, about 6oz, no oil..." : "e.g. 1 cup oatmeal with blueberries"}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>

              <button
                disabled={loading || (!input && !image)}
                onClick={handleSubmit}
                className="w-full bg-secondary hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Consulting Gemini...
                  </span>
                ) : conversation ? "Submit Answer" : "Analyze"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};