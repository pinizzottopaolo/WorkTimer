import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Clock, User, Lock, ArrowRight, WarningCircle } from '@phosphor-icons/react';

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
      <div className="relative z-10 w-full max-w-md p-8 fade-in">
        <div className="bg-white rounded-xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <Clock size={28} weight="bold" className="text-white" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-black uppercase tracking-tight text-gray-900">WorkTimer</h1>
              <p className="text-xs text-gray-500 tracking-wider uppercase">Gestione Tempi</p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <WarningCircle size={18} className="text-red-500" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Email</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  data-testid="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
                  placeholder="email@esempio.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  data-testid="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-lg pl-10 pr-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              data-testid="login-submit-button"
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white font-bold rounded-lg px-5 py-3 hover:bg-blue-600 transition-colors focus:ring-2 focus:ring-blue-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <p className="text-gray-500 text-sm">
              Non hai un account?{' '}
              <Link to="/register" className="text-blue-500 hover:text-blue-600 font-semibold transition-colors">
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
