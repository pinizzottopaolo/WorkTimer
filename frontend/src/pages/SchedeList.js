import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getSchede, deleteScheda } from '../services/api';
import { Plus, MagnifyingGlass, Funnel, Trash, Eye, PencilSimple } from '@phosphor-icons/react';
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
  const [repartoFilter, setRepartoFilter] = useState(searchParams.get('reparto') || '');
  const [deleteId, setDeleteId] = useState(null);

  const fetchSchede = async () => {
    try {
      const params = {};
      if (statusFilter) params.stato = statusFilter;
      if (repartoFilter) params.reparto = repartoFilter;
      const res = await getSchede(params);
      setSchede(res.data);
    } catch (e) {
      console.error('Error fetching schede:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const statoFromUrl = searchParams.get('stato') || '';
    const repartoFromUrl = searchParams.get('reparto') || '';
    if (statoFromUrl !== statusFilter) setStatusFilter(statoFromUrl);
    if (repartoFromUrl !== repartoFilter) setRepartoFilter(repartoFromUrl);
  }, [searchParams]);

  useEffect(() => {
    fetchSchede();
    const params = {};
    if (statusFilter) params.stato = statusFilter;
    if (repartoFilter) params.reparto = repartoFilter;
    setSearchParams(params);
  }, [statusFilter, repartoFilter]);

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
    s.n_ordine_interno?.toLowerCase().includes(searchTerm.toLowerCase())
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
            Schede Lavoro
          </h1>
          <p className="text-gray-500 text-sm mt-1">{schede.length} schede totali</p>
        </div>
        <Link
          to="/schede/nuova"
          data-testid="create-scheda-button"
          className="bg-blue-500 text-white font-bold rounded-lg px-5 py-2.5 hover:bg-blue-600 transition-colors flex items-center gap-2 w-fit"
        >
          <Plus size={18} weight="bold" />
          Nuova Scheda
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            data-testid="search-schede-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca per lavoro, cliente, ordine..."
            className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            data-testid="reparto-filter-select"
            value={repartoFilter}
            onChange={(e) => setRepartoFilter(e.target.value)}
            className="bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tutti i reparti</option>
            <option value="confezione">Confezione</option>
            <option value="stampa">Stampa</option>
          </select>
          <select
            data-testid="status-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-300 text-gray-900 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
          <p className="text-gray-500 mb-4">Nessuna scheda trovata</p>
          <Link
            to="/schede/nuova"
            className="text-blue-500 hover:text-blue-600 font-medium inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Crea la prima scheda
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-xs tracking-wider uppercase font-bold text-gray-500 px-4 py-3">Cliente / Lavoro</th>
                  <th className="text-left text-xs tracking-wider uppercase font-bold text-gray-500 px-4 py-3 hidden md:table-cell">Data</th>
                  <th className="text-left text-xs tracking-wider uppercase font-bold text-gray-500 px-4 py-3 hidden lg:table-cell">Tempo</th>
                  <th className="text-left text-xs tracking-wider uppercase font-bold text-gray-500 px-4 py-3">Stato</th>
                  <th className="text-right text-xs tracking-wider uppercase font-bold text-gray-500 px-4 py-3">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchede.map((scheda) => (
                  <tr key={scheda.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-gray-900 font-bold text-base">{scheda.cliente_nome}</p>
                        <p className="text-gray-600 text-sm">{scheda.lavoro}</p>
                        {scheda.n_ordine_interno && (
                          <p className="text-gray-400 text-xs">#{scheda.n_ordine_interno}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-sm hidden md:table-cell">{scheda.data_lavoro}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="text-sm">
                        <p className="text-gray-500">Stim: <span className="text-gray-700 font-mono">{formatMinutes(scheda.tempo_totale_stimato)}</span></p>
                        <p className="text-gray-500">Eff: <span className={`font-mono ${
                          scheda.tempo_totale_effettivo <= scheda.tempo_totale_stimato ? 'text-green-600' : 'text-red-500'
                        }`}>{formatMinutes(scheda.tempo_totale_effettivo)}</span></p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        scheda.stato === 'completata' ? 'badge-completata' :
                        scheda.stato === 'in_corso' ? 'badge-in-corso' : 'badge-sospesa'
                      }`}>
                        {scheda.stato.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/schede/${scheda.id}`}
                          data-testid={`view-scheda-${scheda.id}`}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          to={`/schede/${scheda.id}/modifica`}
                          data-testid={`edit-scheda-${scheda.id}`}
                          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
                        >
                          <PencilSimple size={18} />
                        </Link>
                        <button
                          onClick={() => setDeleteId(scheda.id)}
                          data-testid={`delete-scheda-${scheda.id}`}
                          className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-500 hover:text-red-500"
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
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Sei sicuro di voler eliminare questa scheda? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
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
