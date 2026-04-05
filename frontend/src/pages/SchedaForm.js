import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getScheda, createScheda, updateScheda, getClienti, getOperazioniTemplate } from '../services/api';
import { 
  ArrowLeft, Plus, Trash, Play, Stop, Clock, FloppyDisk, Check, X
} from '@phosphor-icons/react';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const SchedaForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clienti, setClienti] = useState([]);
  const [operazioniTemplate, setOperazioniTemplate] = useState([]);
  
  const [formData, setFormData] = useState({
    cliente_id: '',
    lavoro: '',
    n_ordine_cliente: '',
    n_ordine_interno: '',
    data_lavoro: format(new Date(), 'yyyy-MM-dd'),
    operazioni: [],
    note: '',
    problemi: '',
    stato: 'in_corso'
  });

  const [activeTimers, setActiveTimers] = useState({});
  const timerIntervals = useRef({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientiRes, opsRes] = await Promise.all([
          getClienti(),
          getOperazioniTemplate()
        ]);
        setClienti(clientiRes.data);
        setOperazioniTemplate(opsRes.data);

        if (isEdit) {
          const schedaRes = await getScheda(id);
          setFormData({
            cliente_id: schedaRes.data.cliente_id,
            lavoro: schedaRes.data.lavoro,
            n_ordine_cliente: schedaRes.data.n_ordine_cliente || '',
            n_ordine_interno: schedaRes.data.n_ordine_interno || '',
            data_lavoro: schedaRes.data.data_lavoro,
            operazioni: schedaRes.data.operazioni || [],
            note: schedaRes.data.note || '',
            problemi: schedaRes.data.problemi || '',
            stato: schedaRes.data.stato
          });
        }
      } catch (e) {
        console.error('Error fetching data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    return () => {
      Object.values(timerIntervals.current).forEach(clearInterval);
    };
  }, [id, isEdit]);

  const addOperazione = (template) => {
    const newOp = {
      nome: template?.nome || 'Nuova Operazione',
      n_fogli: 0,
      n_parti: 0,
      n_colli: 0,
      tempo_stimato: 0,
      tempo_effettivo: 0,
      timer_start: null,
      completata: false
    };
    setFormData(prev => ({
      ...prev,
      operazioni: [...prev.operazioni, newOp]
    }));
  };

  const removeOperazione = (index) => {
    if (timerIntervals.current[index]) {
      clearInterval(timerIntervals.current[index]);
      delete timerIntervals.current[index];
    }
    setActiveTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[index];
      return newTimers;
    });
    setFormData(prev => ({
      ...prev,
      operazioni: prev.operazioni.filter((_, i) => i !== index)
    }));
  };

  const updateOperazione = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      operazioni: prev.operazioni.map((op, i) => 
        i === index ? { ...op, [field]: value } : op
      )
    }));
  };

  const startTimer = (index) => {
    const now = new Date().toISOString();
    updateOperazione(index, 'timer_start', now);
    setActiveTimers(prev => ({ ...prev, [index]: 0 }));

    timerIntervals.current[index] = setInterval(() => {
      setActiveTimers(prev => ({
        ...prev,
        [index]: (prev[index] || 0) + 1
      }));
    }, 1000);
  };

  const stopTimer = (index) => {
    if (timerIntervals.current[index]) {
      clearInterval(timerIntervals.current[index]);
      delete timerIntervals.current[index];
    }

    const op = formData.operazioni[index];
    if (op.timer_start) {
      const startTime = new Date(op.timer_start);
      const elapsed = Math.floor((Date.now() - startTime.getTime()) / 60000);
      const newEffettivo = (op.tempo_effettivo || 0) + Math.max(elapsed, 1);
      
      setFormData(prev => ({
        ...prev,
        operazioni: prev.operazioni.map((o, i) => 
          i === index ? { ...o, tempo_effettivo: newEffettivo, timer_start: null } : o
        )
      }));
    }

    setActiveTimers(prev => {
      const newTimers = { ...prev };
      delete newTimers[index];
      return newTimers;
    });
  };

  const formatTimerDisplay = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.cliente_id || !formData.lavoro) {
      alert('Compila i campi obbligatori');
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await updateScheda(id, formData);
      } else {
        await createScheda(formData);
      }
      navigate('/schede');
    } catch (e) {
      console.error('Error saving scheda:', e);
      alert('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-white/50">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/schede')}
          className="p-2 rounded-sm hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-heading text-2xl font-black uppercase tracking-tight text-white">
            {isEdit ? 'Modifica Scheda' : 'Nuova Scheda Lavoro'}
          </h1>
          <p className="text-white/50 text-sm">Compila i dettagli della lavorazione</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Info */}
        <div className="bg-[#141414] border border-white/10 rounded-sm p-5">
          <h3 className="font-heading text-lg font-bold text-white mb-4">Informazioni Generali</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-[0.2em] uppercase font-bold text-white/50 mb-2">Cliente *</label>
              <select
                data-testid="cliente-select"
                value={formData.cliente_id}
                onChange={(e) => setFormData(prev => ({ ...prev, cliente_id: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white rounded-sm px-3 py-2.5 focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF]"
                required
              >
                <option value="">Seleziona cliente</option>
                {clienti.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs tracking-[0.2em] uppercase font-bold text-white/50 mb-2">Lavoro *</label>
              <input
                data-testid="lavoro-input"
                type="text"
                value={formData.lavoro}
                onChange={(e) => setFormData(prev => ({ ...prev, lavoro: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white rounded-sm px-3 py-2.5 focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] placeholder:text-white/30"
                placeholder="Es: Catalogo primavera"
                required
              />
            </div>

            <div>
              <label className="block text-xs tracking-[0.2em] uppercase font-bold text-white/50 mb-2">N. Ordine Interno</label>
              <input
                data-testid="ordine-interno-input"
                type="text"
                value={formData.n_ordine_interno}
                onChange={(e) => setFormData(prev => ({ ...prev, n_ordine_interno: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white rounded-sm px-3 py-2.5 focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] placeholder:text-white/30"
                placeholder="Es: INT-001"
              />
            </div>

            <div>
              <label className="block text-xs tracking-[0.2em] uppercase font-bold text-white/50 mb-2">Data Lavoro</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    data-testid="data-lavoro-trigger"
                    className="w-full bg-[#0A0A0A] border border-white/20 text-white rounded-sm px-3 py-2.5 text-left flex items-center justify-between hover:border-white/30 transition-colors"
                  >
                    <span>{format(new Date(formData.data_lavoro), 'dd MMMM yyyy', { locale: it })}</span>
                    <Clock size={18} className="text-white/50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#141414] border-white/10" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(formData.data_lavoro)}
                    onSelect={(date) => date && setFormData(prev => ({ 
                      ...prev, 
                      data_lavoro: format(date, 'yyyy-MM-dd') 
                    }))}
                    locale={it}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {isEdit && (
              <div>
                <label className="block text-xs tracking-[0.2em] uppercase font-bold text-white/50 mb-2">Stato</label>
                <select
                  data-testid="stato-select"
                  value={formData.stato}
                  onChange={(e) => setFormData(prev => ({ ...prev, stato: e.target.value }))}
                  className="w-full bg-[#0A0A0A] border border-white/20 text-white rounded-sm px-3 py-2.5 focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF]"
                >
                  <option value="in_corso">In Corso</option>
                  <option value="completata">Completata</option>
                  <option value="sospesa">Sospesa</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Operazioni */}
        <div className="bg-[#141414] border border-white/10 rounded-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-bold text-white">Operazioni</h3>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    data-testid="add-operazione-button"
                    className="bg-[#007AFF] text-white font-bold rounded-sm px-4 py-2 hover:bg-[#3395FF] transition-colors flex items-center gap-2 text-sm"
                  >
                    <Plus size={16} weight="bold" />
                    Aggiungi
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 bg-[#141414] border-white/10" align="end">
                  <div className="space-y-1">
                    {operazioniTemplate.map(op => (
                      <button
                        key={op.id}
                        type="button"
                        onClick={() => addOperazione(op)}
                        className="w-full text-left px-3 py-2 rounded-sm hover:bg-white/10 text-white text-sm transition-colors"
                      >
                        {op.nome}
                      </button>
                    ))}
                    <div className="h-px bg-white/10 my-1"></div>
                    <button
                      type="button"
                      onClick={() => addOperazione(null)}
                      className="w-full text-left px-3 py-2 rounded-sm hover:bg-white/10 text-[#007AFF] text-sm transition-colors"
                    >
                      + Personalizzata
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {formData.operazioni.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-white/10 rounded-sm">
              <p className="text-white/50 text-sm">Nessuna operazione aggiunta</p>
              <p className="text-white/30 text-xs mt-1">Clicca "Aggiungi" per inserire un'operazione</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.operazioni.map((op, index) => (
                <div 
                  key={index}
                  className={`border rounded-sm p-4 transition-all ${
                    activeTimers[index] !== undefined 
                      ? 'border-[#32D74B]/50 bg-[#32D74B]/5 timer-active' 
                      : 'border-white/10 bg-[#0A0A0A]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <input
                      type="text"
                      value={op.nome}
                      onChange={(e) => updateOperazione(index, 'nome', e.target.value)}
                      className="bg-transparent border-none text-white font-semibold text-lg focus:outline-none focus:ring-0 p-0"
                      placeholder="Nome operazione"
                    />
                    <div className="flex items-center gap-2">
                      {op.completata ? (
                        <button
                          type="button"
                          onClick={() => updateOperazione(index, 'completata', false)}
                          className="p-2 rounded-sm bg-[#32D74B]/20 text-[#32D74B] hover:bg-[#32D74B]/30 transition-colors"
                        >
                          <Check size={18} weight="bold" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateOperazione(index, 'completata', true)}
                          className="p-2 rounded-sm border border-white/20 text-white/50 hover:bg-white/5 transition-colors"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeOperazione(index)}
                        className="p-2 rounded-sm hover:bg-[#FF3B30]/10 text-white/50 hover:text-[#FF3B30] transition-colors"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div>
                      <label className="block text-xs text-white/40 mb-1">N. Fogli</label>
                      <input
                        type="number"
                        value={op.n_fogli || ''}
                        onChange={(e) => updateOperazione(index, 'n_fogli', parseInt(e.target.value) || 0)}
                        className="w-full bg-[#141414] border border-white/10 text-white rounded-sm px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">N. Parti</label>
                      <input
                        type="number"
                        value={op.n_parti || ''}
                        onChange={(e) => updateOperazione(index, 'n_parti', parseInt(e.target.value) || 0)}
                        className="w-full bg-[#141414] border border-white/10 text-white rounded-sm px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">N. Colli</label>
                      <input
                        type="number"
                        value={op.n_colli || ''}
                        onChange={(e) => updateOperazione(index, 'n_colli', parseInt(e.target.value) || 0)}
                        className="w-full bg-[#141414] border border-white/10 text-white rounded-sm px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Tempo Stim. (min)</label>
                      <input
                        type="number"
                        value={op.tempo_stimato || ''}
                        onChange={(e) => updateOperazione(index, 'tempo_stimato', parseInt(e.target.value) || 0)}
                        className="w-full bg-[#141414] border border-white/10 text-white rounded-sm px-2 py-1.5 text-sm focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {activeTimers[index] !== undefined ? (
                        <>
                          <div className="text-[#32D74B] font-mono text-xl tracking-wider font-bold">
                            {formatTimerDisplay(activeTimers[index])}
                          </div>
                          <button
                            type="button"
                            data-testid={`stop-timer-${index}`}
                            onClick={() => stopTimer(index)}
                            className="bg-[#FF3B30] text-white font-bold rounded-sm px-4 py-2 hover:bg-[#FF453A] transition-colors flex items-center gap-2 text-sm"
                          >
                            <Stop size={16} weight="fill" />
                            Stop
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          data-testid={`start-timer-${index}`}
                          onClick={() => startTimer(index)}
                          className="bg-[#32D74B] text-black font-bold rounded-sm px-4 py-2 hover:bg-[#30D158] transition-colors flex items-center gap-2 text-sm"
                        >
                          <Play size={16} weight="fill" />
                          Avvia Timer
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-white/40">Tempo Effettivo:</span>
                      <input
                        type="number"
                        value={op.tempo_effettivo || ''}
                        onChange={(e) => updateOperazione(index, 'tempo_effettivo', parseInt(e.target.value) || 0)}
                        className="w-20 bg-[#141414] border border-white/10 text-white rounded-sm px-2 py-1.5 text-sm font-mono focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF]"
                      />
                      <span className="text-xs text-white/40">min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-[#141414] border border-white/10 rounded-sm p-5">
          <h3 className="font-heading text-lg font-bold text-white mb-4">Note e Problemi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-[0.2em] uppercase font-bold text-white/50 mb-2">Note</label>
              <textarea
                data-testid="note-textarea"
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                rows={4}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white rounded-sm px-3 py-2.5 focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] placeholder:text-white/30 resize-none"
                placeholder="Annotazioni generali..."
              />
            </div>
            <div>
              <label className="block text-xs tracking-[0.2em] uppercase font-bold text-white/50 mb-2">Problemi Riscontrati</label>
              <textarea
                data-testid="problemi-textarea"
                value={formData.problemi}
                onChange={(e) => setFormData(prev => ({ ...prev, problemi: e.target.value }))}
                rows={4}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white rounded-sm px-3 py-2.5 focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] placeholder:text-white/30 resize-none"
                placeholder="Eventuali problemi..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/schede')}
            className="border border-white/20 text-white font-bold rounded-sm px-6 py-2.5 hover:bg-white/5 transition-colors"
          >
            Annulla
          </button>
          <button
            type="submit"
            data-testid="save-scheda-button"
            disabled={saving}
            className="bg-[#007AFF] text-white font-bold rounded-sm px-6 py-2.5 hover:bg-[#3395FF] transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <>
                <FloppyDisk size={18} weight="bold" />
                {isEdit ? 'Salva Modifiche' : 'Crea Scheda'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SchedaForm;
