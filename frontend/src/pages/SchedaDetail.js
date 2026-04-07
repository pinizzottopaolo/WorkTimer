import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getScheda, updateScheda, deleteScheda } from '../services/api';
import { ArrowLeft, PencilSimple, Trash, Clock, CheckCircle, WarningCircle, Package, Files, User, Calendar } from '@phosphor-icons/react';
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

const SchedaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scheda, setScheda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    const fetchScheda = async () => {
      try {
        const res = await getScheda(id);
        setScheda(res.data);
      } catch (e) {
        console.error('Error fetching scheda:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchScheda();
  }, [id]);

  const handleDelete = async () => {
    try {
      await deleteScheda(id);
      navigate('/schede');
    } catch (e) {
      console.error('Error deleting scheda:', e);
    }
  };

  const toggleComplete = async () => {
    const newStato = scheda.stato === 'completata' ? 'in_corso' : 'completata';
    try {
      const res = await updateScheda(id, { stato: newStato });
      setScheda(res.data);
    } catch (e) {
      console.error('Error updating stato:', e);
    }
  };

  const formatMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    return `${hours}h ${mins}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-500">Caricamento...</div>
      </div>
    );
  }

  if (!scheda) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Scheda non trovata</p>
        <Link to="/schede" className="text-blue-500 hover:text-blue-600 mt-2 inline-block">
          Torna alle schede
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/schede')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">
              {scheda.lavoro}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{scheda.cliente_nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/schede/${id}/modifica`}
            data-testid="edit-scheda-detail-button"
            className="border border-gray-300 text-gray-700 font-bold rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <PencilSimple size={18} />
            <span className="hidden sm:inline">Modifica</span>
          </Link>
          <button
            onClick={() => setShowDelete(true)}
            data-testid="delete-scheda-detail-button"
            className="border border-red-300 text-red-500 font-bold rounded-lg px-4 py-2 hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <Trash size={18} />
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-lg p-4 flex items-center justify-between ${
        scheda.stato === 'completata' 
          ? 'bg-green-50 border border-green-200' 
          : scheda.stato === 'sospesa'
          ? 'bg-yellow-50 border border-yellow-200'
          : 'bg-blue-50 border border-blue-200'
      }`}>
        <div className="flex items-center gap-3">
          {scheda.stato === 'completata' ? (
            <CheckCircle size={24} className="text-green-500" weight="fill" />
          ) : scheda.stato === 'sospesa' ? (
            <WarningCircle size={24} className="text-yellow-500" weight="fill" />
          ) : (
            <Clock size={24} className="text-blue-500" weight="fill" />
          )}
          <div>
            <p className={`font-bold uppercase text-sm tracking-wider ${
              scheda.stato === 'completata' ? 'text-green-600' : 
              scheda.stato === 'sospesa' ? 'text-yellow-600' : 'text-blue-600'
            }`}>
              {scheda.stato.replace('_', ' ')}
            </p>
            <p className="text-gray-500 text-xs">Ultimo aggiornamento: {new Date(scheda.updated_at).toLocaleString('it-IT')}</p>
          </div>
        </div>
        <button
          onClick={toggleComplete}
          data-testid="toggle-complete-button"
          className={`font-bold rounded-lg px-4 py-2 transition-colors text-sm ${
            scheda.stato === 'completata'
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-green-500 text-white hover:bg-green-600'
          }`}
        >
          {scheda.stato === 'completata' ? 'Riapri' : 'Completa'}
        </button>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <User size={16} />
            <span className="text-xs uppercase tracking-wider">Operatore</span>
          </div>
          <p className="text-gray-900 font-medium">{scheda.operatore_nome}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Calendar size={16} />
            <span className="text-xs uppercase tracking-wider">Data</span>
          </div>
          <p className="text-gray-900 font-medium font-mono">{scheda.data_lavoro}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Files size={16} />
            <span className="text-xs uppercase tracking-wider">Ordine Int.</span>
          </div>
          <p className="text-gray-900 font-medium">{scheda.n_ordine_interno || '-'}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Package size={16} />
            <span className="text-xs uppercase tracking-wider">Operazioni</span>
          </div>
          <p className="text-gray-900 font-medium">{scheda.operazioni?.length || 0}</p>
        </div>
      </div>

      {/* Time Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Riepilogo Tempi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tempo Stimato</p>
            <p className="text-2xl font-mono font-bold text-gray-900">{formatMinutes(scheda.tempo_totale_stimato)}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tempo Effettivo</p>
            <p className={`text-2xl font-mono font-bold ${
              scheda.tempo_totale_effettivo <= scheda.tempo_totale_stimato ? 'text-green-600' : 'text-red-500'
            }`}>
              {formatMinutes(scheda.tempo_totale_effettivo)}
            </p>
          </div>
        </div>
      </div>

      {/* Operazioni */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
        <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Operazioni ({scheda.operazioni?.length || 0})</h3>
        {scheda.operazioni?.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nessuna operazione registrata</p>
        ) : (
          <div className="space-y-3">
            {scheda.operazioni.map((op, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-4 ${
                  op.completata ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {op.completata && <CheckCircle size={18} className="text-green-500" weight="fill" />}
                    <span className="text-gray-900 font-semibold">{op.nome}</span>
                  </div>
                  <span className={`text-sm font-mono ${
                    op.tempo_effettivo <= op.tempo_stimato ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {op.tempo_effettivo}/{op.tempo_stimato} min
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">N. Fogli:</span>
                    <span className="text-gray-700 ml-2">{op.n_fogli || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">N. Parti:</span>
                    <span className="text-gray-700 ml-2">{op.n_parti || 0}</span>
                  </div>
                  {op.n_colli > 0 && (
                    <div>
                      <span className="text-gray-400">N. Colli:</span>
                      <span className="text-gray-700 ml-2">{op.n_colli}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      {(scheda.note || scheda.problemi) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scheda.note && (
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <h3 className="font-heading text-lg font-bold text-gray-900 mb-3">Note</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{scheda.note}</p>
            </div>
          )}
          {scheda.problemi && (
            <div className="bg-white border border-red-200 rounded-lg p-5 shadow-sm">
              <h3 className="font-heading text-lg font-bold text-red-600 mb-3 flex items-center gap-2">
                <WarningCircle size={20} />
                Problemi Riscontrati
              </h3>
              <p className="text-gray-600 whitespace-pre-wrap">{scheda.problemi}</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
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

export default SchedaDetail;
