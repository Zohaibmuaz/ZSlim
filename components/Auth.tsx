import React, { useState } from 'react';
import { UserProfile } from '../types';

interface Props {
  onLogin: (user: UserProfile) => void;
}

export const Auth: React.FC<Props> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Registration fields
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female'>('female');
  const [height, setHeight] = useState<string>(''); // cm
  const [weight, setWeight] = useState<string>(''); // lbs
  
  const calculateCalories = (weightLbs: number, heightCm: number, ageYrs: number, gender: 'male' | 'female') => {
    // Mifflin-St Jeor Equation
    const weightKg = weightLbs * 0.453592;
    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * ageYrs);
    
    if (gender === 'male') {
        bmr += 5;
    } else {
        bmr -= 161;
    }

    // Sedentary Multiplier (Hardcoded as per rules)
    const tdee = bmr * 1.2;
    
    // Deficit for weight loss (approx 500 cal deficit)
    return Math.round(tdee - 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError("Username is required");
      return;
    }

    const usersStr = localStorage.getItem('slimlogic_users');
    const users = usersStr ? JSON.parse(usersStr) : {};

    if (isLogin) {
      // LOGIN LOGIC
      if (!users[cleanUsername]) {
        setError("User not found. Please create an account first.");
        return;
      }
      
      if (users[cleanUsername].password === password) {
        onLogin(users[cleanUsername].profile);
      } else {
        setError("Incorrect password.");
      }
    } else {
      // SIGN UP LOGIC
      if (users[cleanUsername]) {
        setError("User already exists. Please log in.");
        return;
      }
      
      const w = parseFloat(weight);
      const h = parseFloat(height);
      const a = parseFloat(age);
      
      if (!w || !h || !a) {
        setError("Please fill all fields to calculate your plan.");
        return;
      }

      const dailyCalorieLimit = calculateCalories(w, h, a, gender);
      const profile: UserProfile = {
        username: cleanUsername,
        age: a,
        gender,
        heightCm: h,
        currentWeight: w,
        targetWeight: w - 10, // Default target
        dailyCalorieLimit: Math.max(1200, dailyCalorieLimit), // Safety floor
        activityLevel: 'sedentary'
      };

      const newUser = { password, profile };
      users[cleanUsername] = newUser;
      localStorage.setItem('slimlogic_users', JSON.stringify(users));
      onLogin(profile);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
            🌱
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">SlimLogic AI</h1>
          <p className="text-gray-500 font-medium">Precision weight loss coach.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r text-red-700 text-sm font-medium animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Username</label>
            <input 
              required 
              type="text" 
              placeholder="e.g. zohaib muaz"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-medium"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Password</label>
            <input 
              required 
              type="password" 
              placeholder="••••••••"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-medium"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {!isLogin && (
            <div className="space-y-4 animate-fade-in pt-4 border-t border-dashed border-gray-200">
               <div className="bg-blue-50 text-blue-800 p-3 rounded-xl text-xs font-medium text-center">
                 calculate 100% accurate calorie limits
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Age</label>
                    <input required type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none" value={age} onChange={e => setAge(e.target.value)} />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Gender</label>
                    <select className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none" value={gender} onChange={e => setGender(e.target.value as any)}>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Height (cm)</label>
                    <input required type="number" placeholder="170" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none" value={height} onChange={e => setHeight(e.target.value)} />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Weight (lbs)</label>
                    <input required type="number" placeholder="160" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none" value={weight} onChange={e => setWeight(e.target.value)} />
                 </div>
               </div>
            </div>
          )}

          <button type="submit" className="w-full bg-primary hover:bg-emerald-600 text-white font-bold py-4 rounded-xl mt-6 shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]">
            {isLogin ? "Log In" : "Calculate Plan & Sign Up"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button type="button" onClick={toggleMode} className="text-sm text-gray-500 font-medium hover:text-primary transition-colors">
            {isLogin ? (
              <span>New here? <span className="text-primary underline decoration-2 underline-offset-2">Create an account</span></span>
            ) : (
              <span>Have an account? <span className="text-primary underline decoration-2 underline-offset-2">Log in</span></span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};