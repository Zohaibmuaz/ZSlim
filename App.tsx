import React, { useState, useEffect } from 'react';
import { DailyLog, UserProfile, AppView, FoodEntry } from './types';
import { AddFoodModal } from './components/AddFoodModal';
import { WeightCheckIn } from './components/WeightCheckIn';
import { FoodDetailModal } from './components/FoodDetailModal';
import { Advisor } from './components/Advisor';
import { Reports } from './components/Reports';
import { FoodAlternative } from './components/FoodAlternative';
import { History } from './components/History';
import { Auth } from './components/Auth';

const App: React.FC = () => {
  // User Session
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // State
  const [view, setView] = useState<AppView>(AppView.TRACKER);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodEntry | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);

  // Current Day Logic
  const todayStr = new Date().toISOString().split('T')[0];
  const currentLog = logs.find(l => l.date === todayStr) || { date: todayStr, entries: [] };
  const caloriesConsumed = currentLog.entries.reduce((acc, e) => acc + e.macros.calories, 0);

  // Load User Data - CRITICAL: Only runs when username changes (login)
  useEffect(() => {
    if (currentUser?.username) {
      const savedLogs = localStorage.getItem(`slimlogic_data_${currentUser.username}`);
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      } else {
        setLogs([]); // Reset for new user if no data
      }
    }
  }, [currentUser?.username]);

  // Persist Logs - Runs whenever logs change
  useEffect(() => {
    if (currentUser?.username) {
      localStorage.setItem(`slimlogic_data_${currentUser.username}`, JSON.stringify(logs));
    }
  }, [logs, currentUser?.username]);

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setView(AppView.TRACKER);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLogs([]);
    setView(AppView.TRACKER);
  };

  const handleAddFood = (entry: FoodEntry) => {
    const updatedLogs = [...logs];
    const logIndex = updatedLogs.findIndex(l => l.date === todayStr);
    
    if (logIndex >= 0) {
      updatedLogs[logIndex].entries.push(entry);
    } else {
      updatedLogs.push({ date: todayStr, entries: [entry] });
    }
    setLogs(updatedLogs);
  };

  const handleRemoveFood = (entryId: string) => {
    if (!window.confirm("Remove this item?")) return;
    
    setLogs(prevLogs => {
      // Robust removal: Search ALL logs for this ID and filter it out.
      // This handles cases where date calculations might differ slightly or across midnights.
      return prevLogs.map(log => ({
        ...log,
        entries: log.entries.filter(e => e.id !== entryId)
      }));
    });
  };

  const handleWeightSubmit = (weight: number) => {
    const updatedLogs = [...logs];
    const logIndex = updatedLogs.findIndex(l => l.date === todayStr);
    
    // 1. Update Logs State
    if (logIndex >= 0) {
      updatedLogs[logIndex].weight = weight;
    } else {
      updatedLogs.push({ date: todayStr, entries: [], weight });
    }
    
    // IMPORTANT: Update state immediately
    setLogs(updatedLogs);

    // 2. Update User Profile State & Persistence
    if (currentUser) {
        const updatedUser = { ...currentUser, currentWeight: weight };
        setCurrentUser(updatedUser);
        
        // Update the main user database in local storage
        const usersStr = localStorage.getItem('slimlogic_users');
        if (usersStr) {
            const users = JSON.parse(usersStr);
            if (users[currentUser.username]) {
                users[currentUser.username].profile = updatedUser;
                localStorage.setItem('slimlogic_users', JSON.stringify(users));
            }
        }
    }
    
    // 3. Close Modal
    setShowCheckIn(false);
  };

  const getPreviousWeight = () => {
    const sorted = [...logs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const prev = sorted.find(l => l.weight && l.date !== todayStr);
    return prev?.weight;
  };

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  // Render Logic
  const renderView = () => {
    switch(view) {
      case AppView.ADVISOR:
        return (
            <Advisor 
                caloriesConsumed={caloriesConsumed} 
                dailyLimit={currentUser.dailyCalorieLimit} 
                logs={logs}
                userProfile={currentUser}
            />
        );
      case AppView.ALTERNATIVES:
        return <FoodAlternative />;
      case AppView.HISTORY:
        return <History logs={logs} />;
      case AppView.REPORTS:
        return <Reports logs={logs} onClose={() => setView(AppView.TRACKER)} />; 
      case AppView.TRACKER:
      default:
        return (
          <div className="pb-24 max-w-xl mx-auto px-4 pt-6 animate-fade-in">
             {/* Header */}
             <div className="flex justify-between items-center mb-6">
                 <div>
                     <h1 className="text-xl font-bold text-gray-800">Hi, {currentUser.username}</h1>
                     <div className="text-xs text-gray-500 font-medium bg-gray-100 inline-block px-2 py-1 rounded mt-1">Goal: {currentUser.dailyCalorieLimit} kcal/day</div>
                 </div>
                 <div className="flex items-center space-x-3">
                    <button onClick={() => setView(AppView.REPORTS)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">Reports</button>
                    <button onClick={handleLogout} className="px-3 py-1.5 bg-red-50 border border-red-100 rounded-lg text-xs font-bold text-red-600 hover:bg-red-100 transition-colors">Log Out</button>
                 </div>
             </div>

             {/* Dashboard Header */}
             <div className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Today</h1>
                    <div className="text-gray-400 text-sm font-medium">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-black text-primary tracking-tighter">{Math.max(0, currentUser.dailyCalorieLimit - caloriesConsumed)}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Calories Left</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden relative shadow-inner mb-5">
                  <div 
                    className={`h-full transition-all duration-1000 ease-out shadow-lg ${caloriesConsumed > currentUser.dailyCalorieLimit ? 'bg-red-500' : 'bg-primary'}`} 
                    style={{ width: `${Math.min(100, (caloriesConsumed / currentUser.dailyCalorieLimit) * 100)}%` }}
                  ></div>
                </div>
                
                <div className="pt-5 border-t border-gray-50 flex items-center justify-between text-gray-600 text-sm font-medium relative z-10">
                  <button 
                    onClick={() => setShowCheckIn(true)}
                    className="flex items-center bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors border border-gray-200/50"
                  >
                      <span className="mr-2 text-lg">⚖️</span>
                      <span>{currentLog.weight ? `${currentLog.weight} lbs` : 'Log Weight'}</span>
                  </button>
                  <div className={`text-xs ${caloriesConsumed > currentUser.dailyCalorieLimit ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                    {Math.round((caloriesConsumed / currentUser.dailyCalorieLimit) * 100)}% Consumed
                  </div>
                </div>
             </div>

             {/* Food List */}
             <div className="space-y-4">
               <div className="flex justify-between items-end px-2">
                  <h3 className="font-bold text-gray-800 text-lg">Your Meals</h3>
                  {currentLog.entries.length > 0 && (
                      <span className="text-xs text-gray-400 font-medium bg-white px-2 py-1 rounded-full border border-gray-100 shadow-sm">{currentLog.entries.length} items</span>
                  )}
               </div>

               {currentLog.entries.length === 0 ? (
                 <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                   <div className="text-5xl mb-4 opacity-80">🍽️</div>
                   <p className="text-gray-900 font-bold text-lg mb-1">Your plate is empty</p>
                   <p className="text-gray-400 text-sm">Tap the + button to log your first meal</p>
                 </div>
               ) : (
                 currentLog.entries.slice().reverse().map(entry => (
                   <div 
                     key={entry.id}
                     className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center group active:scale-[0.98] transition-all hover:shadow-md cursor-pointer"
                     onClick={() => setSelectedFood(entry)}
                   >
                     <div className="flex items-center flex-1">
                       {entry.imageUri ? (
                         <img src={entry.imageUri} className="w-16 h-16 rounded-xl object-cover mr-5 shadow-sm border border-gray-100" />
                       ) : (
                         <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center mr-5 text-emerald-600 font-black text-2xl shadow-sm border border-emerald-100">
                           {entry.name.charAt(0).toUpperCase()}
                         </div>
                       )}
                       <div>
                         <h4 className="font-bold text-gray-800 text-lg leading-tight mb-1">{entry.name}</h4>
                         <div className="flex items-center space-x-2">
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 text-xs font-bold">{entry.macros.calories} kcal</span>
                            {entry.verdict && (
                                <span className="text-[10px] text-gray-400 truncate max-w-[120px]">{entry.verdict}</span>
                            )}
                         </div>
                       </div>
                     </div>
                     
                     <button 
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            handleRemoveFood(entry.id); 
                        }}
                        className="w-12 h-12 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors z-20 border border-transparent hover:border-red-100"
                        aria-label="Delete Meal"
                     >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                     </button>
                   </div>
                 ))
               )}
             </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-900">
      
      {/* Main Content Area */}
      {renderView()}

      {/* Sticky Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 px-6 py-3 flex justify-between items-center z-40 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
        <button 
          onClick={() => setView(AppView.TRACKER)}
          className={`flex flex-col items-center space-y-1 w-16 transition-colors ${view === AppView.TRACKER ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          <span className="text-[10px] font-extrabold tracking-wide">LOG</span>
        </button>

        <button 
          onClick={() => setView(AppView.HISTORY)}
          className={`flex flex-col items-center space-y-1 w-16 transition-colors ${view === AppView.HISTORY ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          <span className="text-[10px] font-extrabold tracking-wide">HISTORY</span>
        </button>

        {/* FAB for Add Food */}
        <div className="relative -top-8 group">
            <button 
            onClick={() => setShowAddModal(true)}
            className="bg-primary hover:bg-emerald-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-xl shadow-emerald-200 transition-all group-hover:scale-105 active:scale-95 border-4 border-white"
            >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
            </button>
        </div>

        <button 
          onClick={() => setView(AppView.ALTERNATIVES)}
          className={`flex flex-col items-center space-y-1 w-16 transition-colors ${view === AppView.ALTERNATIVES ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
           <span className="text-[10px] font-extrabold tracking-wide">SWAP</span>
        </button>

        <button 
          onClick={() => setView(AppView.ADVISOR)}
          className={`flex flex-col items-center space-y-1 w-16 transition-colors ${view === AppView.ADVISOR ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           <span className="text-[10px] font-extrabold tracking-wide">ASK</span>
        </button>
      </div>

      {/* Modals */}
      <AddFoodModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
        onAdd={handleAddFood} 
      />
      
      <WeightCheckIn 
        isOpen={showCheckIn} 
        onSubmit={handleWeightSubmit} 
        lastWeight={getPreviousWeight()}
      />
      
      <FoodDetailModal 
        entry={selectedFood} 
        onClose={() => setSelectedFood(null)} 
      />

    </div>
  );
};

export default App;