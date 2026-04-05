import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getScheda, updateScheda, deleteScheda } from '../services/api';
import { 
  ArrowLeft, PencilSimple, Trash, Clock, CheckCircle, 
  WarningCircle, Package, Files, User, Calendar
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
        <div className="animate-pulse text-white/50">Caricamento...</div>
      </div>
    );
  }

  if (!scheda) {
    return (
      <div className="text-center py-12">
        <p className="text-white/50">Scheda non trovata</p>
        <Link to="/schede" className="text-[#007AFF] hover:text-[#3395FF] mt-2 inline-block">
          Torna alle schede
        </Link>
      </div>
    );
  }

  const efficiency = scheda.tempo_totale_stimato > 0 
    ? Math.round((scheda.tempo_totale_effettivo / scheda.tempo_totale_stimato) * 100)
    : 0;

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/schede')}
            className="p-2 rounded-sm hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              {scheda.lavoro}
            </h1>
            <p className="text-white/50 text-sm mt-1">{scheda.cliente_nome}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/schede/${id}/modifica`}
            data-testid="edit-scheda-detail-button"
            className="border border-white/20 text-white font-bold rounded-sm px-4 py-2 hover:bg-white/5 transition-colors flex items-center gap-2"
          >
            <PencilSimple size={18} />
            Modifica
          </Link>
          <button
            onClick={() => setShowDelete(true)}
            data-testid="delete-scheda-detail-button"
            className="border border-[#FF3B30]/50 text-[#FF3B30] font-bold rounded-sm px-4 py-2 hover:bg-[#FF3B30]/10 transition-colors flex items-center gap-2"
          >
            <Trash size={18} />
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-sm p-4 flex items-center justify-between ${
        scheda.stato === 'completata' 
          ? 'bg-[#32D74B]/10 border border-[#32D74B]/30' 
          : scheda.stato === 'sospesa'
          ? 'bg-[#FFD60A]/10 border border-[#FFD60A]/30'
          : 'bg-[#007AFF]/10 border border-[#007AFF]/30'
      }`}>
        <div className="flex items-center gap-3">
          {scheda.stato === 'completata' ? (
            <CheckCircle size={24} className="text-[#32D74B]" weight="fill" />
          ) : scheda.stato === 'sospesa' ? (
            <WarningCircle size={24} className="text-[#FFD60A]" weight="fill" />
          ) : (
            <Clock size={24} className="text-[#007AFF]" weight="fill" />
          )}
          <div>
            <p className={`font-bold uppercase text-sm tracking-wider ${
              scheda.stato === 'completata' ? 'text-[#32D74B]' : 
              scheda.stato === 'sospesa' ? 'text-[#FFD60A]' : 'text-[#007AFF]'
            }`}>
              {scheda.stato.replace('_', ' ')}
            </p>
            <p className="text-white/50 text-xs">Ultimo aggiornamento: {new Date(scheda.updated_at).toLocaleString('it-IT')}</p>
          </div>
        </div>
        <button
          onClick={toggleComplete}
          data-testid="toggle-complete-button"
          className={`font-bold rounded-sm px-4 py-2 transition-colors text-sm ${
            scheda.stato === 'completata'
              ? 'bg-white/10 text-white hover:bg-white/20'
              : 'bg-[#32D74B] text-black hover:bg-[#30D158]'
          }`}
        >
          {scheda.stato === 'completata' ? 'Riapri' : 'Completa'}
        </button>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141414] border border-white/10 rounded-sm p-4">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <User size={16} />
            <span className="text-xs uppercase tracking-wider">Operatore</span>
          </div>
          <p className="text-white font-medium">{scheda.operatore_nome}</p>
        </div>
        <div className="bg-[#141414] border border-white/10 rounded-sm p-4">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <Calendar size={16} />
            <span className="text-xs uppercase tracking-wider">Data</span>
          </div>
          <p className="text-white font-medium font-mono">{scheda.data_lavoro}</p>
        </div>
        <div className="bg-[#141414] border border-white/10 rounded-sm p-4">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <Files size={16} />
            <span className="text-xs uppercase tracking-wider">Ordine Cliente</span>
          </div>
          <p className="text-white font-medium">{scheda.n_ordine_cliente || '-'}</p>
        </div>
        <div className="bg-[#141414] border border-white/10 rounded-sm p-4">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <Package size={16} />
            <span className="text-xs uppercase tracking-wider">Ordine Interno</span>
          </div>
          <p className="text-white font-medium">{scheda.n_ordine_interno || '-'}</p>
        </div>
      </div>

      {/* Time Summary */}
      <div className="bg-[#141414] border border-white/10 rounded-sm p-5">
        <h3 className="font-heading text-lg font-bold text-white mb-4">Riepilogo Tempi</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-[#0A0A0A] rounded-sm">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Tempo Stimato</p>
            <p className="text-2xl font-mono font-bold text-white">{formatMinutes(scheda.tempo_totale_stimato)}</p>
          </div>
          <div className="text-center p-4 bg-[#0A0A0A] rounded-sm">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Tempo Effettivo</p>
            <p className={`text-2xl font-mono font-bold ${
              scheda.tempo_totale_effettivo <= scheda.tempo_totale_stimato ? 'text-[#32D74B]' : 'text-[#FF3B30]'
            }`}>
              {formatMinutes(scheda.tempo_totale_effettivo)}
            </p>
          </div>
          <div className="text-center p-4 bg-[#0A0A0A] rounded-sm">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Efficienza</p>
            <p className={`text-2xl font-mono font-bold ${
              efficiency <= 100 ? 'text-[#32D74B]' : 'text-[#FF3B30]'
            }`}>
              {efficiency}%
            </p>
          </div>
        </div>
      </div>

      {/* Operazioni */}
      <div className="bg-[#141414] border border-white/10 rounded-sm p-5">
        <h3 className="font-heading text-lg font-bold text-white mb-4">Operazioni ({scheda.operazioni?.length || 0})</h3>
        {scheda.operazioni?.length === 0 ? (
          <p className="text-white/50 text-center py-8">Nessuna operazione registrata</p>
        ) : (
          <div className="space-y-3">
            {scheda.operazioni.map((op, index) => (
              <div 
                key={index}
                className={`border rounded-sm p-4 ${
                  op.completata ? 'border-[#32D74B]/30 bg-[#32D74B]/5' : 'border-white/10 bg-[#0A0A0A]'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {op.completata && <CheckCircle size={18} className="text-[#32D74B]" weight="fill" />}
                    <span className="text-white font-semibold">{op.nome}</span>
                  </div>
                  <span className={`text-sm font-mono ${
                    op.tempo_effettivo <= op.tempo_stimato ? 'text-[#32D74B]' : 'text-[#FF3B30]'
                  }`}>
                    {op.tempo_effettivo}/{op.tempo_stimato} min
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-white/40">N. Fogli:</span>
                    <span className="text-white ml-2">{op.n_fogli || 0}</span>
                  </div>
                  <div>
                    <span className="text-white/40">N. Parti:</span>
                    <span className="text-white ml-2">{op.n_parti || 0}</span>
                  </div>
                  <div>
                    <span className="text-white/40">N. Colli:</span>
                    <span className="text-white ml-2">{op.n_colli || 0}</span>
                  </div>
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
            <div className="bg-[#141414] border border-white/10 rounded-sm p-5">
              <h3 className="font-heading text-lg font-bold text-white mb-3">Note</h3>
              <p className="text-white/70 whitespace-pre-wrap">{scheda.note}</p>
            </div>
          )}
          {scheda.problemi && (
            <div className="bg-[#141414] border border-[#FF3B30]/20 rounded-sm p-5">
              <h3 className="font-heading text-lg font-bold text-[#FF3B30] mb-3 flex items-center gap-2">
                <WarningCircle size={20} />
                Problemi Riscontrati
              </h3>
              <p className="text-white/70 whitespace-pre-wrap">{scheda.problemi}</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
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

export default SchedaDetail;
