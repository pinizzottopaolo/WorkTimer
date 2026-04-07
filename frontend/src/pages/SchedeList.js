import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getSchede, deleteScheda } from '../services/api';
import { 
  Plus, MagnifyingGlass, Funnel, Trash, Eye, PencilSimple,
  CaretLeft, CaretRight
} from '@phosphor-icons/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';

const SchedeList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [schede, setSchede] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('stato') || '');
  const [deleteId, setDeleteId] = useState(null);

  const fetchSchede = async () => {
    try {
      const params = {};
      if (statusFilter) params.stato = statusFilter;
      const res = await getSchede(params);
      setSchede(res.data);
    } catch (e) {
      console.error('Error fetching schede:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Sync URL params with state
    const statoFromUrl = searchParams.get('stato') || '';
    if (statoFromUrl !== statusFilter) {
      setStatusFilter(statoFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchSchede();
    // Update URL when filter changes
    if (statusFilter) {
      setSearchParams({ stato: statusFilter });
    } else {
      setSearchParams({});
    }
  }, [statusFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteScheda(deleteId);
      setSchede(schede.filter(s => s.id !== deleteId));
      setDeleteId(null);
    } catch (e) {
      console.error('Error deleting scheda:', e);
    }
  };

  const filteredSchede = schede.filter(s => 
    s.lavoro.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.cliente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.n_ordine_cliente?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    return `${hours}h ${mins}min`;
  };

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
            Schede Lavoro
          </h1>
          <p className="text-white/50 text-sm mt-1">{schede.length} schede totali</p>
        </div>
        <Link
          to="/schede/nuova"
          data-testid="create-scheda-button"
          className="bg-[#007AFF] text-white font-bold rounded-sm px-5 py-2.5 hover:bg-[#3395FF] transition-colors flex items-center gap-2 w-fit"
        >
          <Plus size={18} weight="bold" />
          Nuova Scheda
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            data-testid="search-schede-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca per lavoro, cliente, ordine..."
            className="w-full bg-[#141414] border border-white/10 text-white rounded-sm pl-10 pr-4 py-2.5 focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] placeholder:text-white/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <Funnel size={18} className="text-white/50" />
          <select
            data-testid="status-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#141414] border border-white/10 text-white rounded-sm px-4 py-2.5 focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF]"
          >
            <option value="">Tutti gli stati</option>
            <option value="in_corso">In Corso</option>
            <option value="completata">Completata</option>
            <option value="sospesa">Sospesa</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredSchede.length === 0 ? (
        <div className="bg-[#141414] border border-white/10 rounded-sm p-12 text-center">
          <p className="text-white/50 mb-4">Nessuna scheda trovata</p>
          <Link
            to="/schede/nuova"
            className="text-[#007AFF] hover:text-[#3395FF] font-medium inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Crea la prima scheda
          </Link>
        </div>
      ) : (
        <div className="bg-[#141414] border border-white/10 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs tracking-[0.1em] uppercase font-bold text-white/50 px-4 py-3">Lavoro</th>
                  <th className="text-left text-xs tracking-[0.1em] uppercase font-bold text-white/50 px-4 py-3">Cliente</th>
                  <th className="text-left text-xs tracking-[0.1em] uppercase font-bold text-white/50 px-4 py-3">Data</th>
                  <th className="text-left text-xs tracking-[0.1em] uppercase font-bold text-white/50 px-4 py-3">Tempo</th>
                  <th className="text-left text-xs tracking-[0.1em] uppercase font-bold text-white/50 px-4 py-3">Stato</th>
                  <th className="text-right text-xs tracking-[0.1em] uppercase font-bold text-white/50 px-4 py-3">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchede.map((scheda) => (
                  <tr key={scheda.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{scheda.lavoro}</p>
                        {scheda.n_ordine_cliente && (
                          <p className="text-white/40 text-xs">#{scheda.n_ordine_cliente}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/70">{scheda.cliente_nome}</td>
                    <td className="px-4 py-3 text-white/70 font-mono text-sm">{scheda.data_lavoro}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="text-white/50">Stimato: <span className="text-white font-mono">{formatMinutes(scheda.tempo_totale_stimato)}</span></p>
                        <p className="text-white/50">Effettivo: <span className={`font-mono ${
                          scheda.tempo_totale_effettivo <= scheda.tempo_totale_stimato ? 'text-[#32D74B]' : 'text-[#FF3B30]'
                        }`}>{formatMinutes(scheda.tempo_totale_effettivo)}</span></p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-sm text-xs font-bold uppercase ${
                        scheda.stato === 'completata' ? 'badge-completata' :
                        scheda.stato === 'in_corso' ? 'badge-in-corso' : 'badge-sospesa'
                      }`}>
                        {scheda.stato.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/schede/${scheda.id}`}
                          data-testid={`view-scheda-${scheda.id}`}
                          className="p-2 rounded-sm hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          to={`/schede/${scheda.id}/modifica`}
                          data-testid={`edit-scheda-${scheda.id}`}
                          className="p-2 rounded-sm hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                        >
                          <PencilSimple size={18} />
                        </Link>
                        <button
                          onClick={() => setDeleteId(scheda.id)}
                          data-testid={`delete-scheda-${scheda.id}`}
                          className="p-2 rounded-sm hover:bg-[#FF3B30]/10 transition-colors text-white/60 hover:text-[#FF3B30]"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-[#141414] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Sei sicuro di voler eliminare questa scheda? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/20 text-white hover:bg-white/5">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-[#FF3B30] text-white hover:bg-[#FF453A]"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SchedeList;
