import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getStatsOverview, getSchede } from '../services/api';
import { Files, Clock, CheckCircle, Timer, ArrowRight, Plus, Package, Printer } from '@phosphor-icons/react';

const RepartoCard = ({ reparto, label, icon: Icon, color, stats, recentSchede, navigate }) => {
  const formatMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`p-4 ${color} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon size={28} weight="bold" />
            <h2 className="font-heading text-xl font-black uppercase">{label}</h2>
          </div>
          <Link
            to={`/schede/nuova?reparto=${reparto}`}
            className="bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg px-4 py-2 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus size={16} weight="bold" />
            Nuova
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="p-4 grid grid-cols-3 gap-4 border-b border-gray-100">
        <div 
          onClick={() => navigate(`/schede?reparto=${reparto}`)}
          className="text-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
        >
          <p className="text-2xl font-black text-gray-900 font-heading">{stats?.total_schede || 0}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Totali</p>
        </div>
        <div 
          onClick={() => navigate(`/schede?reparto=${reparto}&stato=in_corso`)}
          className="text-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
        >
          <p className="text-2xl font-black text-yellow-500 font-heading">{stats?.schede_in_corso || 0}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">In Corso</p>
        </div>
        <div 
          onClick={() => navigate(`/schede?reparto=${reparto}&stato=completata`)}
          className="text-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
        >
          <p className="text-2xl font-black text-green-500 font-heading">{stats?.schede_completate || 0}</p>
          <p className="text-xs text-gray-500 uppercase tracking-wider">Completate</p>
        </div>
      </div>

      {/* Tempo */}
      <div className="p-4 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Tempo Totale</span>
          <span className="font-mono font-bold text-gray-900">{formatMinutes(stats?.tempo_effettivo_totale || 0)}</span>
        </div>
      </div>

      {/* Recent */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Recenti</h3>
          <Link to={`/schede?reparto=${reparto}`} className="text-blue-500 hover:text-blue-600 text-xs font-medium flex items-center gap-1">
            Vedi tutte <ArrowRight size={12} />
          </Link>
        </div>
        
        {recentSchede.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Nessuna scheda</p>
        ) : (
          <div className="space-y-2">
            {recentSchede.slice(0, 3).map((scheda) => (
              <Link
                key={scheda.id}
                to={`/schede/${scheda.id}`}
                className="block p-2 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-900 font-medium text-sm">{scheda.cliente_nome}</p>
                    <p className="text-gray-500 text-xs">{scheda.lavoro}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    scheda.stato === 'completata' ? 'bg-green-100 text-green-600' :
                    scheda.stato === 'in_corso' ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {scheda.stato === 'in_corso' ? 'In corso' : scheda.stato}
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

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [confezioneStats, setConfezioneStats] = useState(null);
  const [stampaStats, setStampaStats] = useState(null);
  const [confezioneSchede, setConfezioneSchede] = useState([]);
  const [stampaSchede, setStampaSchede] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [confStats, stampStats, confSchede, stampSchede] = await Promise.all([
          getStatsOverview('confezione'),
          getStatsOverview('stampa'),
          getSchede({ reparto: 'confezione', limit: 5 }),
          getSchede({ reparto: 'stampa', limit: 5 })
        ]);
        setConfezioneStats(confStats.data);
        setStampaStats(stampStats.data);
        setConfezioneSchede(confSchede.data.slice(0, 5));
        setStampaSchede(stampSchede.data.slice(0, 5));
      } catch (e) {
        console.error('Error fetching dashboard data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">
          Benvenuto, {user?.name}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {user?.role === 'admin' ? 'Panoramica generale' : 'Le tue schede lavoro'}
        </p>
      </div>

      {/* Reparti Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RepartoCard 
          reparto="confezione"
          label="Disponibilità"
          icon={Package}
          color="bg-blue-500"
          stats={confezioneStats}
          recentSchede={confezioneSchede}
          navigate={navigate}
        />
        <RepartoCard 
          reparto="stampa"
          label="Confezione"
          icon={Printer}
          color="bg-purple-500"
          stats={stampaStats}
          recentSchede={stampaSchede}
          navigate={navigate}
        />
      </div>
    </div>
  );
};

export default Dashboard;
