import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Loader2, Eye, EyeOff } from 'lucide-react'; // Added Eye icons
import { auth, db } from './firebase'; // Import your firebase config
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getUserByEmail } from './services/databaseService';

const Login = () => {
  const [role, setRole] = useState('Student');
  const [isDark, setIsDark] = useState(false);
  const [email, setEmail] = useState(''); // Added state for email
  const [password, setPassword] = useState(''); // Added state for password
  const [showPassword, setShowPassword] = useState(false); // Added state for password visibility
  const [loading, setLoading] = useState(false); // Added loading state
  const [error, setError] = useState(''); // Added error state
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Fetch User Data from Firestore (ER Diagram: USER entity)
      const userData = await getUserByEmail(user.email);
      
      if (userData) {
        // 3. Derive role name directly from role_id
        const roleMap = {
          1: 'Admin',
          2: 'Teacher',
          3: 'Student'
        };
        const userRoleName = roleMap[userData.role_id] || 'Student';
        
        // 4. Role Validation: Check if the selected role matches the DB role
        if (userRoleName === role) {
          // Save user role and ID to localStorage for ProtectedRoute
          localStorage.setItem('userRole', role);
          localStorage.setItem('userId', userData.id);
          localStorage.setItem('roleId', userData.role_id);
          localStorage.setItem('isAuthenticated', 'true');
          
          // Navigate based on role
          if (role === 'Student') navigate('/student-dashboard');
          else if (role === 'Teacher') navigate('/teacher-dashboard');
          else if (role === 'Admin') navigate('/admin-dashboard');
        } else {
          setError(`Unauthorized: Your account is registered as ${userRoleName}, not ${role}`);
        }
      } else {
        setError("User profile not found in database.");
      }
    } catch (err) {
      console.error('Login error:', err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-500 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      
      {/* Toggle Button Positioned Top-Right */}
      <button 
        onClick={() => setIsDark(!isDark)}
        className={`absolute top-8 right-8 p-3 rounded-full transition-all duration-300 shadow-lg ${isDark ? 'bg-slate-800 text-yellow-400 border-slate-700' : 'bg-white text-slate-600 border-slate-200'} border`}
      >
        {isDark ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <div className={`max-w-md w-full rounded-3xl shadow-2xl p-10 border transition-all duration-500 ${
        isDark 
          ? 'bg-slate-900 border-slate-800 shadow-blue-900/20' 
          : 'bg-white border-white shadow-slate-700'
      }`}>
        
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-blue-600 tracking-tight">LMS Portal</h1>
          <p className={`mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Please sign in to your account
          </p>
        </div>

        {/* --- NEW: Error Alert --- */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl animate-pulse">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleLogin}>
          {/* Role Toggle Bar */}
          <div className={`p-1.5 rounded-2xl flex ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
            {['Student', 'Teacher', 'Admin'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  role === r 
                    ? (isDark ? 'bg-slate-800 text-blue-400 shadow-lg' : 'bg-white text-blue-600 shadow-sm') 
                    : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700')
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <input 
              type="email" 
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${
                isDark 
                ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-900/50' 
                : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-100'
              } focus:ring-4 focus:border-blue-500`} 
              required 
            />
            
            <div className="space-y-2">
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all ${
                    isDark 
                    ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-900/50' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-100'
                  } focus:ring-4 focus:border-blue-500 pr-12`} 
                  required 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-colors ${
                    isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {/* Forgot Password Link */}
              <div className="flex justify-end px-2">
                <button 
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className={`text-sm font-semibold transition-colors ${
                    isDark ? 'text-slate-500 hover:text-blue-400' : 'text-slate-400 hover:text-blue-600'
                  }`}
                >
                  Forgot Password?
                </button>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : `Sign In as ${role}`}
          </button>
        </form>

        {/* --- NEW: Register Option --- */}
        <div className="mt-8 text-center transition-all">
          <p className={`text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Don't have an account?{' '}
            <button 
              onClick={() => navigate('/SignUp')}
              className="text-blue-600 font-bold hover:underline ml-1"
            >
              Register Now
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;