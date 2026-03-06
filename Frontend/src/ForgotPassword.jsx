import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, ShieldCheck, Sun, Moon, Loader2 } from 'lucide-react';
import { auth } from './firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isDark, setIsDark] = useState(false); // Theme State
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
      setMessage("If an account with that email exists, a password reset link has been sent. Please check your inbox.");
      console.log('Password reset email sent successfully to:', email);
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors duration-500 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      
      {/* --- TOP RIGHT THEME TOGGLE --- */}
      <button 
        onClick={() => setIsDark(!isDark)}
        className={`absolute top-8 right-8 p-3 rounded-full transition-all duration-300 shadow-lg border ${
          isDark 
          ? 'bg-slate-800 text-yellow-400 border-slate-700 hover:bg-slate-700' 
          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
        }`}
      >
        {isDark ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      {/* --- FORGOT PASSWORD CARD --- */}
      <div className={`max-w-md w-full rounded-[2.5rem] shadow-2xl p-10 border transition-all duration-500 relative ${
        isDark 
        ? 'bg-slate-900 border-slate-800 shadow-blue-900/10' 
        : 'bg-white border-white shadow-slate-200'
      }`}>
        
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className={`absolute top-8 left-8 p-2 transition-colors ${isDark ? 'text-slate-500 hover:text-blue-400' : 'text-slate-400 hover:text-blue-600'}`}
        >
          <ArrowLeft size={20} />
        </button>

        <div className="text-center mb-8 pt-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
            <Mail size={28} />
          </div>
          <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
            Forgot Password?
          </h1>
          <p className={`mt-2 font-medium px-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm font-bold rounded-2xl">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-600 text-sm font-bold rounded-2xl">
            {message}
            <div className="mt-2 text-xs space-y-1">
              <p>⚠️ <strong>Important:</strong> Check your spam/junk folder if you don't see the email within 2 minutes.</p>
              <p>📧 Add <code className="bg-gray-200 px-1 rounded">noreply@lms-portal-97d9a.firebaseapp.com</code> to your contacts to ensure delivery.</p>
            </div>
          </div>
        )}

        {!emailSent ? (
          /* EMAIL FORM */
          <form className="space-y-6" onSubmit={handleSendResetEmail}>
            <div className="space-y-2">
              <label className={`text-xs font-black uppercase tracking-widest ml-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. name@university.com" 
                className={`w-full px-5 py-4 rounded-2xl border outline-none transition-all font-medium ${
                  isDark 
                  ? 'bg-slate-800 border-slate-700 text-white focus:ring-blue-900/50' 
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-blue-100'
                } focus:ring-4 focus:border-blue-500`}
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-[0.98] uppercase text-xs tracking-widest flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          /* SUCCESS STATE */
          <div className="text-center space-y-4">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'}`}>
              <ShieldCheck size={32} />
            </div>
            <button 
              onClick={() => navigate('/')}
              className={`w-full py-4 rounded-2xl font-black shadow-xl transition-all active:scale-[0.98] uppercase text-xs tracking-widest ${
                isDark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;