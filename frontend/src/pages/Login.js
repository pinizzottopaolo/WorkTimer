import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Clock, User, Lock, ArrowRight, Warning } from '@phosphor-icons/react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const result = await login(email, password);
    setIsLoading(false);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center login-bg relative">
      <div className="absolute inset-0 bg-black/70"></div>
      
      <div className="relative z-10 w-full max-w-md p-8 fade-in">
        <div className="bg-[#141414] border border-white/10 rounded-sm p-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-[#007AFF] rounded-sm flex items-center justify-center">
              <Clock size={28} weight="bold" className="text-white" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-black uppercase tracking-tight text-white">WorkTimer</h1>
              <p className="text-xs text-white/50 tracking-[0.2em] uppercase">Gestione Tempi</p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/30 rounded-sm flex items-center gap-2">
              <Warning size={18} className="text-[#FF3B30]" />
              <span className="text-sm text-[#FF3B30]">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs tracking-[0.2em] uppercase font-bold text-white/50 mb-2">Email</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  data-testid="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/20 text-white rounded-sm pl-10 pr-3 py-2.5 focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] transition-all placeholder:text-white/30"
                  placeholder="email@esempio.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs tracking-[0.2em] uppercase font-bold text-white/50 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  data-testid="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/20 text-white rounded-sm pl-10 pr-3 py-2.5 focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] transition-all placeholder:text-white/30"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              data-testid="login-submit-button"
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#007AFF] text-white font-bold rounded-sm px-5 py-3 hover:bg-[#3395FF] transition-colors focus:ring-2 focus:ring-[#007AFF]/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <>
                  Accedi
                  <ArrowRight size={18} weight="bold" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/50 text-sm">
              Non hai un account?{' '}
              <Link to="/register" className="text-[#007AFF] hover:text-[#3395FF] font-semibold transition-colors">
                Registrati
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
