import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Ensure storage is available if you plan to link profile pictures or docs during signup
import { auth, db, storage } from './firebase'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { createUser, getRoleByName } from './services/databaseService';
import { Loader2, Moon, Sun, Eye, EyeOff, ArrowLeft } from 'lucide-react';

const Signup = () => {
  const [role, setRole] = useState('Student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Get role_id from ROLE entity based on selected role name (ER Diagram)
      const roleData = await getRoleByName(role);
      const roleId = roleData ? roleData.role_id : 3; // Default to Student (role_id: 3)

      // 3. Save user to USER collection with proper ER Diagram structure
      await createUser({
        name: email.split('@')[0], // Default name from email
        email: user.email,
        password: password, // Note: In production, don't store plain password
        role_name: role,      // This will be converted to role_id
        createdAt: new Date()
      });

      alert("Account created successfully!");
      navigate('/'); 
    } catch (err) {
      // Friendly error handling for common Firebase issues
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-500 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      
      {/* Theme Toggle */}
      <button 
        onClick={() => setIsDark(!isDark)}
        className={`absolute top-8 right-8 p-3 rounded-full transition-all duration-300 shadow-lg ${isDark ? 'bg-slate-800 text-yellow-400 border-slate-700' : 'bg-white text-slate-600 border-slate-200'} border`}
      >
        {isDark ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      {/* Main Signup Card */}
      <div className={`max-w-md w-full rounded-3xl shadow-xl p-10 border transition-all duration-500 ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        <h1 className="text-3xl font-black text-blue-600 text-center mb-2">Create Account</h1>
        <p className={`text-center mb-8 text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Join the LMS platform today
        </p>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold animate-in fade-in zoom-in duration-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          {/* Role Selection */}
          <div className={`p-1.5 rounded-2xl flex transition-colors ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
            {['Student', 'Teacher', 'Admin'].map((r) => (
              <button 
                key={r} type="button" onClick={() => setRole(r)}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all ${
                  role === r 
                  ? (isDark ? 'bg-slate-800 text-blue-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm') 
                  : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <input 
              type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${
                isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200'
              } focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10`} required 
            />
            
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200'
                } focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 pr-12`} required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            disabled={loading} 
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : `Register as ${role}`}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/')}
            className={`flex items-center justify-center gap-2 mx-auto text-sm font-bold transition-colors ${
              isDark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            <ArrowLeft size={16} /> Already have an account? Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;