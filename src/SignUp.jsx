import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Ensure storage is available if you plan to link profile pictures or docs during signup
import { auth, db, storage } from './firebase'; 
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { createUser, getRoleByName, isStudentRegistrationEnabled } from './services/databaseService';
import { Loader2, Moon, Sun, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useTheme } from './ThemeContext';

const Signup = () => {
  const [role, setRole] = useState('Student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [checkingSettings, setCheckingSettings] = useState(true);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  // Check if student registration is enabled
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        setCheckingSettings(true);
        const enabled = await isStudentRegistrationEnabled();
        setRegistrationEnabled(enabled);
      } catch (error) {
        console.error('Error checking registration status:', error);
        setRegistrationEnabled(true); // Default to enabled on error
      } finally {
        setCheckingSettings(false);
      }
    };
    checkRegistrationStatus();
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Self-signup is Student only (role_id: 3) to match Firestore rules
      const effectiveRole = 'Student';

      // 3. Save user to USER collection with proper ER Diagram structure
      await createUser({
        uid: user.uid,
        name: email.split('@')[0], // Default name from email
        email: user.email,
        password: password, // Note: In production, don't store plain password
        role_name: effectiveRole,
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
        onClick={toggleTheme}
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

        {!registrationEnabled && !checkingSettings && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl text-xs font-bold animate-in fade-in zoom-in duration-300">
            Student registration is currently disabled by the administrator. Please contact your administrator for assistance.
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          {/* Role Selection */}
          <div className={`p-1.5 rounded-2xl flex transition-colors ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
            {['Student', 'Teacher'].map((r) => (
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
              disabled={!registrationEnabled || checkingSettings}
              className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${
                isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200'
              } focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed`} required 
            />
            
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                disabled={!registrationEnabled || checkingSettings}
                className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-600' : 'bg-slate-50 border-slate-200'
                } focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 pr-12 disabled:opacity-50 disabled:cursor-not-allowed`} required 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={!registrationEnabled || checkingSettings}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading || !registrationEnabled || checkingSettings} 
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkingSettings ? 'Loading...' : loading ? <Loader2 className="animate-spin" size={20} /> : !registrationEnabled ? 'Registration Disabled' : `Register as ${role}`}
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