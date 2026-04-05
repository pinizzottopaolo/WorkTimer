import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getStatsOverview, getSchede } from '../services/api';
import { 
  Files, Clock, CheckCircle, Timer, ArrowRight, Plus, 
  TrendUp, TrendDown, Minus
} from '@phosphor-icons/react';

const Dashboard = () => {
  const { user } = useAuth();
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

  const getEfficiencyPercent = () => {
    if (!stats || stats.tempo_stimato_totale === 0) return 0;
    return Math.round((stats.tempo_effettivo_totale / stats.tempo_stimato_totale) * 100);
  };

  const efficiency = getEfficiencyPercent();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-white/50">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            Benvenuto, {user?.name}
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {user?.role === 'admin' ? 'Panoramica generale' : 'Le tue schede lavoro'}
          </p>
        </div>
        <Link
          to="/schede/nuova"
          data-testid="new-scheda-button"
          className="bg-[#007AFF] text-white font-bold rounded-sm px-5 py-2.5 hover:bg-[#3395FF] transition-colors flex items-center gap-2 w-fit"
        >
          <Plus size={18} weight="bold" />
          Nuova Scheda
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {/* Total Schede */}
        <div className="stat-card rounded-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase font-bold text-white/50">Totale Schede</p>
              <p className="text-3xl font-black text-white mt-2 font-heading">{stats?.total_schede || 0}</p>
            </div>
            <div className="w-10 h-10 bg-[#007AFF]/20 rounded-sm flex items-center justify-center">
              <Files size={22} className="text-[#007AFF]" />
            </div>
          </div>
        </div>

        {/* In Corso */}
        <div className="stat-card rounded-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase font-bold text-white/50">In Corso</p>
              <p className="text-3xl font-black text-white mt-2 font-heading">{stats?.schede_in_corso || 0}</p>
            </div>
            <div className="w-10 h-10 bg-[#FFD60A]/20 rounded-sm flex items-center justify-center">
              <Timer size={22} className="text-[#FFD60A]" />
            </div>
          </div>
        </div>

        {/* Completate */}
        <div className="stat-card rounded-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase font-bold text-white/50">Completate</p>
              <p className="text-3xl font-black text-white mt-2 font-heading">{stats?.schede_completate || 0}</p>
            </div>
            <div className="w-10 h-10 bg-[#32D74B]/20 rounded-sm flex items-center justify-center">
              <CheckCircle size={22} className="text-[#32D74B]" />
            </div>
          </div>
        </div>

        {/* Efficienza */}
        <div className="stat-card rounded-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase font-bold text-white/50">Efficienza</p>
              <div className="flex items-baseline gap-2 mt-2">
                <p className="text-3xl font-black text-white font-heading">{efficiency}%</p>
                {efficiency < 100 ? (
                  <TrendUp size={18} className="text-[#32D74B]" />
                ) : efficiency > 100 ? (
                  <TrendDown size={18} className="text-[#FF3B30]" />
                ) : (
                  <Minus size={18} className="text-white/50" />
                )}
              </div>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-sm flex items-center justify-center">
              <Clock size={22} className="text-white/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Time Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#141414] border border-white/10 rounded-sm p-5">
          <h3 className="font-heading text-lg font-bold text-white mb-4">Riepilogo Tempi</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60">Tempo Stimato Totale</span>
              <span className="font-mono text-white font-semibold">{formatMinutes(stats?.tempo_stimato_totale || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Tempo Effettivo Totale</span>
              <span className="font-mono text-white font-semibold">{formatMinutes(stats?.tempo_effettivo_totale || 0)}</span>
            </div>
            <div className="h-px bg-white/10"></div>
            <div className="flex items-center justify-between">
              <span className="text-white/60">Differenza</span>
              <span className={`font-mono font-semibold ${
                (stats?.tempo_effettivo_totale || 0) <= (stats?.tempo_stimato_totale || 0) ? 'text-[#32D74B]' : 'text-[#FF3B30]'
              }`}>
                {(stats?.tempo_effettivo_totale || 0) <= (stats?.tempo_stimato_totale || 0) ? '-' : '+'}
                {formatMinutes(Math.abs((stats?.tempo_effettivo_totale || 0) - (stats?.tempo_stimato_totale || 0)))}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Schede */}
        <div className="bg-[#141414] border border-white/10 rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-bold text-white">Schede Recenti</h3>
            <Link to="/schede" className="text-[#007AFF] hover:text-[#3395FF] text-sm font-medium flex items-center gap-1">
              Vedi tutte <ArrowRight size={14} />
            </Link>
          </div>
          
          {recentSchede.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-white/50 text-sm">Nessuna scheda ancora</p>
              <Link 
                to="/schede/nuova" 
                className="text-[#007AFF] hover:text-[#3395FF] text-sm font-medium mt-2 inline-flex items-center gap-1"
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
                  className="block p-3 rounded-sm border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-sm">{scheda.lavoro}</p>
                      <p className="text-white/50 text-xs">{scheda.cliente_nome}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-sm text-xs font-bold uppercase ${
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
    </div>
  );
};

export default Dashboard;
