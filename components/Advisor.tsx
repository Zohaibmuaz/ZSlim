import React, { useState, useEffect, useRef } from 'react';
import { chatWithAdvisor, evaluateFoodChoice } from '../services/geminiService';
import { UserProfile, DailyLog, AdvisorResult } from '../types';

interface Props {
  caloriesConsumed: number;
  dailyLimit: number;
  logs: DailyLog[]; // Pass full logs for context
  userProfile: UserProfile;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const Advisor: React.FC<Props> = ({ caloriesConsumed, dailyLimit, logs, userProfile }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'check'>('chat');
  
  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hi ${userProfile.username}! I'm your SlimLogic coach. I see you've eaten ${caloriesConsumed} of your ${dailyLimit} calories today. How can I help you right now?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Meal Check State
  const [mealImage, setMealImage] = useState<string | null>(null);
  const [mealDesc, setMealDesc] = useState('');
  const [mealResult, setMealResult] = useState<AdvisorResult | null>(null);
  const [checking, setChecking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom for chat
  useEffect(() => {
    if (activeTab === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const handleSendChat = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    const context = `
      Current Weight: ${userProfile.currentWeight}lbs. Target: ${userProfile.targetWeight}lbs.
      Daily Calorie Limit: ${dailyLimit}. Consumed Today: ${caloriesConsumed}.
      Remaining Calories: ${dailyLimit - caloriesConsumed}.
      Recent Logs Summary: ${JSON.stringify(logs.slice(-3).map(l => ({ date: l.date, calories: l.entries.reduce((a,c) => a + c.macros.calories, 0), weight: l.weight })))}
    `;

    const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
    }));

    const response = await chatWithAdvisor(userMsg, history, context);
    
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setLoading(false);
  };

  const handleMealCheck = async () => {
    if ((!mealImage && !mealDesc) || checking) return;
    setChecking(true);
    setMealResult(null);

    const context = `Consumed Today: ${caloriesConsumed}/${dailyLimit}. Remaining: ${dailyLimit - caloriesConsumed} cal.`;
    
    const result = await evaluateFoodChoice(mealImage, mealDesc, context);
    setMealResult(result);
    setChecking(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setMealImage(base64);
        setMealResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50">
       {/* Header with Tabs */}
       <div className="bg-white border-b px-4 py-4 shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xl font-bold text-gray-800">Advisor</h2>
            <div className="text-xs text-green-600 font-medium flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
              Online
            </div>
          </div>
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl">
             <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'chat' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                AI Coach
             </button>
             <button 
                onClick={() => setActiveTab('check')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'check' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
             >
                Meal Check
             </button>
          </div>
       </div>

       {/* CHAT VIEW */}
       {activeTab === 'chat' && (
           <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                        }`}>
                        {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm">
                        <div className="flex space-x-2">
                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-75"></div>
                            <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                    </div>
                )}
            </div>
            <div className="p-4 bg-white border-t border-gray-200">
                <form 
                    onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}
                    className="flex items-center space-x-2"
                >
                    <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your diet..."
                    className="flex-1 bg-gray-100 border-0 rounded-full px-5 py-3 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                    <button 
                    type="submit" 
                    disabled={!input.trim() || loading}
                    className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
                    >
                        <svg className="w-5 h-5 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
                </form>
            </div>
           </>
       )}

       {/* MEAL CHECK VIEW */}
       {activeTab === 'check' && (
           <div className="flex-1 p-6 overflow-y-auto">
               <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                   <p className="text-blue-800 text-sm font-medium">
                       Snap a photo before you eat. I'll analyze your remaining calories ({dailyLimit - caloriesConsumed}) and give you a strict Yes/No.
                   </p>
               </div>

               <div className="space-y-4">
                   {/* Upload Area */}
                   <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative rounded-xl overflow-hidden h-48 bg-gray-100 border-2 ${!mealImage ? 'border-dashed border-gray-300 cursor-pointer' : 'border-transparent'}`}
                    >
                        {mealImage ? (
                            <img src={`data:image/jpeg;base64,${mealImage}`} className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <span>Upload Food</span>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                        {mealImage && (
                             <button 
                                onClick={(e) => { e.stopPropagation(); setMealImage(null); setMealResult(null); }}
                                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                             >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                             </button>
                        )}
                   </div>
                   
                   <textarea 
                      value={mealDesc}
                      onChange={(e) => setMealDesc(e.target.value)}
                      placeholder="Or describe the food..."
                      className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500"
                      rows={2}
                   />

                   <button 
                      onClick={handleMealCheck}
                      disabled={(!mealImage && !mealDesc) || checking}
                      className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center"
                   >
                      {checking ? "Analyzing Choice..." : "Should I Eat This?"}
                   </button>
               </div>

               {/* Result Display */}
               {mealResult && (
                   <div className="mt-8 animate-fade-in">
                       <div className={`p-6 rounded-2xl text-center border-4 ${mealResult.recommendation === 'Yes' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                           <div className={`text-6xl font-black mb-2 ${mealResult.recommendation === 'Yes' ? 'text-green-600' : 'text-red-600'}`}>
                               {mealResult.recommendation.toUpperCase()}
                           </div>
                           <p className="text-gray-800 font-medium text-lg leading-relaxed">
                               {mealResult.reason}
                           </p>
                       </div>
                       <p className="text-center text-xs text-gray-400 mt-4">
                           Based on your current daily stats. Result is not saved to logs.
                       </p>
                   </div>
               )}
           </div>
       )}
    </div>
  );
};