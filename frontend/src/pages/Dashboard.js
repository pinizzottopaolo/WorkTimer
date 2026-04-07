import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getStatsOverview, getSchede } from '../services/api';
import { Files, Clock, CheckCircle, Timer, ArrowRight, Plus } from '@phosphor-icons/react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentSchede, setRecentSchede] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, schedeRes] = await Promise.all([
          getStatsOverview(),
          getSchede({ limit: 5 })
        ]);
        setStats(statsRes.data);
        setRecentSchede(schedeRes.data.slice(0, 5));
      } catch (e) {
        console.error('Error fetching dashboard data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    return `${hours}h ${mins}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">
            Benvenuto, {user?.name}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {user?.role === 'admin' ? 'Panoramica generale' : 'Le tue schede lavoro'}
          </p>
        </div>
        <Link
          to="/schede/nuova"
          data-testid="new-scheda-button"
          className="bg-blue-500 text-white font-bold rounded-lg px-5 py-2.5 hover:bg-blue-600 transition-colors flex items-center gap-2 w-fit shadow-sm"
        >
          <Plus size={18} weight="bold" />
          Nuova Scheda
        </Link>
      </div>

      {/* Stats Grid - Clickable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {/* Total Schede */}
        <div 
          onClick={() => navigate('/schede')}
          className="stat-card p-5 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs tracking-wider uppercase font-bold text-gray-500">Totale Schede</p>
              <p className="text-3xl font-black text-gray-900 mt-2 font-heading">{stats?.total_schede || 0}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Files size={22} className="text-blue-500" />
            </div>
          </div>
          <p className="text-xs text-blue-500 mt-3 font-medium">Clicca per vedere tutte →</p>
        </div>

        {/* In Corso */}
        <div 
          onClick={() => navigate('/schede?stato=in_corso')}
          className="stat-card p-5 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs tracking-wider uppercase font-bold text-gray-500">In Corso</p>
              <p className="text-3xl font-black text-gray-900 mt-2 font-heading">{stats?.schede_in_corso || 0}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Timer size={22} className="text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-yellow-600 mt-3 font-medium">Clicca per filtrare →</p>
        </div>

        {/* Completate */}
        <div 
          onClick={() => navigate('/schede?stato=completata')}
          className="stat-card p-5 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs tracking-wider uppercase font-bold text-gray-500">Completate</p>
              <p className="text-3xl font-black text-gray-900 mt-2 font-heading">{stats?.schede_completate || 0}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle size={22} className="text-green-500" />
            </div>
          </div>
          <p className="text-xs text-green-500 mt-3 font-medium">Clicca per filtrare →</p>
        </div>

        {/* Tempo Totale */}
        <div className="stat-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs tracking-wider uppercase font-bold text-gray-500">Tempo Totale</p>
              <p className="text-3xl font-black text-gray-900 mt-2 font-heading font-mono">{formatMinutes(stats?.tempo_totale_effettivo || 0)}</p>
            </div>
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Clock size={22} className="text-gray-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Schede */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-bold text-gray-900">Schede Recenti</h3>
          <Link to="/schede" className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1">
            Vedi tutte <ArrowRight size={14} />
          </Link>
        </div>
        
        {recentSchede.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">Nessuna scheda ancora</p>
            <Link 
              to="/schede/nuova" 
              className="text-blue-500 hover:text-blue-600 text-sm font-medium mt-2 inline-flex items-center gap-1"
            >
              Crea la prima <Plus size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentSchede.map((scheda) => (
              <Link
                key={scheda.id}
                to={`/schede/${scheda.id}`}
                className="block p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 font-medium text-sm">{scheda.lavoro}</p>
                    <p className="text-gray-500 text-xs">{scheda.cliente_nome}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    scheda.stato === 'completata' ? 'badge-completata' :
                    scheda.stato === 'in_corso' ? 'badge-in-corso' : 'badge-sospesa'
                  }`}>
                    {scheda.stato.replace('_', ' ')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
