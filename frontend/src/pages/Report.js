import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getStatsOverview, getStatsPerCliente, getStatsPerOperatore, 
  getStatsPerPeriodo, getStatsPerOperazione 
} from '../services/api';
import { 
  ChartBar, Users, Calendar, Clock, Download, TrendUp, TrendDown
} from '@phosphor-icons/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar as CalendarComponent } from '../components/ui/calendar';
import { format, subDays } from 'date-fns';
import { it } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const COLORS = ['#007AFF', '#32D74B', '#FF3B30', '#FFD60A', '#AF52DE', '#5AC8FA'];

const Report = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [perCliente, setPerCliente] = useState([]);
  const [perOperatore, setPerOperatore] = useState([]);
  const [perPeriodo, setPerPeriodo] = useState([]);
  const [perOperazione, setPerOperazione] = useState([]);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        data_da: format(dateRange.from, 'yyyy-MM-dd'),
        data_a: format(dateRange.to, 'yyyy-MM-dd')
      };
      
      const [overviewRes, clienteRes, periodoRes, operazioneRes] = await Promise.all([
        getStatsOverview(),
        getStatsPerCliente(),
        getStatsPerPeriodo(params),
        getStatsPerOperazione()
      ]);

      setOverview(overviewRes.data);
      setPerCliente(clienteRes.data);
      setPerPeriodo(periodoRes.data);
      setPerOperazione(operazioneRes.data);

      if (user?.role === 'admin') {
        const operatoreRes = await getStatsPerOperatore();
        setPerOperatore(operatoreRes.data);
      }
    } catch (e) {
      console.error('Error fetching report data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const formatMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    return `${hours}h ${mins}min`;
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Overview sheet
    const overviewData = [
      ['Metrica', 'Valore'],
      ['Totale Schede', overview?.total_schede || 0],
      ['Schede In Corso', overview?.schede_in_corso || 0],
      ['Schede Completate', overview?.schede_completate || 0],
      ['Tempo Stimato Totale (min)', overview?.tempo_stimato_totale || 0],
      ['Tempo Effettivo Totale (min)', overview?.tempo_effettivo_totale || 0]
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Riepilogo');

    // Per Cliente sheet
    if (perCliente.length > 0) {
      const clienteData = [
        ['Cliente', 'N. Schede', 'Tempo Stimato (min)', 'Tempo Effettivo (min)'],
        ...perCliente.map(c => [c.cliente, c.schede_count, c.tempo_stimato, c.tempo_effettivo])
      ];
      const wsCliente = XLSX.utils.aoa_to_sheet(clienteData);
      XLSX.utils.book_append_sheet(wb, wsCliente, 'Per Cliente');
    }

    // Per Operazione sheet
    if (perOperazione.length > 0) {
      const opData = [
        ['Operazione', 'Conteggio', 'Tempo Stimato (min)', 'Tempo Effettivo (min)'],
        ...perOperazione.map(o => [o.operazione, o.count, o.tempo_stimato, o.tempo_effettivo])
      ];
      const wsOp = XLSX.utils.aoa_to_sheet(opData);
      XLSX.utils.book_append_sheet(wb, wsOp, 'Per Operazione');
    }

    // Per Periodo sheet
    if (perPeriodo.length > 0) {
      const periodoData = [
        ['Data', 'N. Schede', 'Tempo Stimato (min)', 'Tempo Effettivo (min)'],
        ...perPeriodo.map(p => [p.data, p.schede_count, p.tempo_stimato, p.tempo_effettivo])
      ];
      const wsPeriodo = XLSX.utils.aoa_to_sheet(periodoData);
      XLSX.utils.book_append_sheet(wb, wsPeriodo, 'Per Periodo');
    }

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `report_worktimer_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1A1A1A] border border-white/20 rounded-sm p-3 shadow-lg">
          <p className="text-white font-medium text-sm mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Tempo') ? formatMinutes(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-white/50">Caricamento report...</div>
      </div>
    );
  }

  const efficiency = overview?.tempo_stimato_totale > 0 
    ? Math.round((overview.tempo_effettivo_totale / overview.tempo_stimato_totale) * 100)
    : 0;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
            Report & Statistiche
          </h1>
          <p className="text-white/50 text-sm mt-1">Analisi dei tempi di lavoro</p>
        </div>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <button className="border border-white/20 text-white font-medium rounded-sm px-4 py-2 hover:bg-white/5 transition-colors flex items-center gap-2">
                <Calendar size={18} />
                <span className="text-sm">
                  {format(dateRange.from, 'dd MMM', { locale: it })} - {format(dateRange.to, 'dd MMM yyyy', { locale: it })}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-[#141414] border-white/10" align="end">
              <CalendarComponent
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                locale={it}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <button
            onClick={exportToExcel}
            data-testid="export-excel-button"
            className="bg-[#32D74B] text-black font-bold rounded-sm px-4 py-2 hover:bg-[#30D158] transition-colors flex items-center gap-2"
          >
            <Download size={18} weight="bold" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141414] border border-white/10 rounded-sm p-5">
          <p className="text-xs tracking-[0.2em] uppercase font-bold text-white/50">Tempo Stimato</p>
          <p className="text-2xl font-mono font-bold text-white mt-2">{formatMinutes(overview?.tempo_stimato_totale || 0)}</p>
        </div>
        <div className="bg-[#141414] border border-white/10 rounded-sm p-5">
          <p className="text-xs tracking-[0.2em] uppercase font-bold text-white/50">Tempo Effettivo</p>
          <p className={`text-2xl font-mono font-bold mt-2 ${
            (overview?.tempo_effettivo_totale || 0) <= (overview?.tempo_stimato_totale || 0) ? 'text-[#32D74B]' : 'text-[#FF3B30]'
          }`}>
            {formatMinutes(overview?.tempo_effettivo_totale || 0)}
          </p>
        </div>
        <div className="bg-[#141414] border border-white/10 rounded-sm p-5">
          <p className="text-xs tracking-[0.2em] uppercase font-bold text-white/50">Efficienza</p>
          <div className="flex items-center gap-2 mt-2">
            <p className={`text-2xl font-mono font-bold ${efficiency <= 100 ? 'text-[#32D74B]' : 'text-[#FF3B30]'}`}>
              {efficiency}%
            </p>
            {efficiency < 100 ? (
              <TrendUp size={20} className="text-[#32D74B]" />
            ) : efficiency > 100 ? (
              <TrendDown size={20} className="text-[#FF3B30]" />
            ) : null}
          </div>
        </div>
        <div className="bg-[#141414] border border-white/10 rounded-sm p-5">
          <p className="text-xs tracking-[0.2em] uppercase font-bold text-white/50">Differenza</p>
          <p className={`text-2xl font-mono font-bold mt-2 ${
            (overview?.tempo_effettivo_totale || 0) <= (overview?.tempo_stimato_totale || 0) ? 'text-[#32D74B]' : 'text-[#FF3B30]'
          }`}>
            {(overview?.tempo_effettivo_totale || 0) <= (overview?.tempo_stimato_totale || 0) ? '-' : '+'}
            {formatMinutes(Math.abs((overview?.tempo_effettivo_totale || 0) - (overview?.tempo_stimato_totale || 0)))}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Per Cliente Chart */}
        <div className="bg-[#141414] border border-white/10 rounded-sm p-5">
          <h3 className="font-heading text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users size={20} className="text-[#007AFF]" />
            Tempi per Cliente
          </h3>
          {perCliente.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-white/50">Nessun dato</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={perCliente.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="cliente" 
                  stroke="rgba(255,255,255,0.5)" 
                  angle={-45} 
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 11 }}
                />
                <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="tempo_stimato" name="Tempo Stimato" fill="#007AFF" radius={[2, 2, 0, 0]} />
                <Bar dataKey="tempo_effettivo" name="Tempo Effettivo" fill="#32D74B" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Per Operazione Chart */}
        <div className="bg-[#141414] border border-white/10 rounded-sm p-5">
          <h3 className="font-heading text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ChartBar size={20} className="text-[#007AFF]" />
            Distribuzione Operazioni
          </h3>
          {perOperazione.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-white/50">Nessun dato</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={perOperazione.slice(0, 6)}
                  dataKey="count"
                  nameKey="operazione"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ operazione, percent }) => `${operazione} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                >
                  {perOperazione.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="bg-[#141414] border border-white/10 rounded-sm p-5">
        <h3 className="font-heading text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock size={20} className="text-[#007AFF]" />
          Andamento nel Tempo
        </h3>
        {perPeriodo.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-white/50">Nessun dato nel periodo selezionato</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={perPeriodo} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="data" stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
              <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="tempo_stimato" name="Tempo Stimato" stroke="#007AFF" strokeWidth={2} dot={{ fill: '#007AFF' }} />
              <Line type="monotone" dataKey="tempo_effettivo" name="Tempo Effettivo" stroke="#32D74B" strokeWidth={2} dot={{ fill: '#32D74B' }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Per Operatore (Admin Only) */}
      {user?.role === 'admin' && perOperatore.length > 0 && (
        <div className="bg-[#141414] border border-white/10 rounded-sm p-5">
          <h3 className="font-heading text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users size={20} className="text-[#007AFF]" />
            Performance Operatori
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs tracking-[0.1em] uppercase font-bold text-white/50 px-4 py-3">Operatore</th>
                  <th className="text-center text-xs tracking-[0.1em] uppercase font-bold text-white/50 px-4 py-3">Schede</th>
                  <th className="text-center text-xs tracking-[0.1em] uppercase font-bold text-white/50 px-4 py-3">Tempo Stimato</th>
                  <th className="text-center text-xs tracking-[0.1em] uppercase font-bold text-white/50 px-4 py-3">Tempo Effettivo</th>
                  <th className="text-center text-xs tracking-[0.1em] uppercase font-bold text-white/50 px-4 py-3">Efficienza</th>
                </tr>
              </thead>
              <tbody>
                {perOperatore.map((op) => {
                  const opEfficiency = op.tempo_stimato > 0 
                    ? Math.round((op.tempo_effettivo / op.tempo_stimato) * 100)
                    : 0;
                  return (
                    <tr key={op.operatore} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3 text-white font-medium">{op.operatore}</td>
                      <td className="px-4 py-3 text-center text-white">{op.schede_count}</td>
                      <td className="px-4 py-3 text-center text-white/70 font-mono">{formatMinutes(op.tempo_stimato)}</td>
                      <td className="px-4 py-3 text-center font-mono">
                        <span className={op.tempo_effettivo <= op.tempo_stimato ? 'text-[#32D74B]' : 'text-[#FF3B30]'}>
                          {formatMinutes(op.tempo_effettivo)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-mono font-bold ${opEfficiency <= 100 ? 'text-[#32D74B]' : 'text-[#FF3B30]'}`}>
                          {opEfficiency}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Report;
