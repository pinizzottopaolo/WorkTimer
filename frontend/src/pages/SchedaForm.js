import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { getScheda, createScheda, updateScheda, getClienti, getOperazioniTemplate } from '../services/api';
import { ArrowLeft, Plus, Trash, FloppyDisk, Check, CaretDown } from '@phosphor-icons/react';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { CalendarBlank } from '@phosphor-icons/react';

const SchedaForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const repartoFromUrl = searchParams.get('reparto') || 'confezione';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clienti, setClienti] = useState([]);
  const [operazioniTemplate, setOperazioniTemplate] = useState([]);
  const [showOpMenu, setShowOpMenu] = useState(false);
  
  const [formData, setFormData] = useState({
    cliente_id: '',
    lavoro: '',
    reparto: repartoFromUrl,
    n_ordine_cliente: '',
    n_ordine_interno: '',
    data_lavoro: format(new Date(), 'yyyy-MM-dd'),
    quantita: 0,
    quantita_effettiva: 0,
    resa: 0,
    note_generali: '',
    formato_stampa: '',
    formato_finito: '',
    operazioni: [],
    note: '',
    problemi: '',
    stato: 'in_corso',
    tempo_stimato_totale: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientiRes, opsRes] = await Promise.all([
          getClienti(),
          getOperazioniTemplate(isEdit ? null : repartoFromUrl)
        ]);
        setClienti(clientiRes.data);
        setOperazioniTemplate(opsRes.data);

        if (isEdit) {
          const schedaRes = await getScheda(id);
          setFormData({
            cliente_id: schedaRes.data.cliente_id,
            lavoro: schedaRes.data.lavoro,
            reparto: schedaRes.data.reparto || 'confezione',
            n_ordine_cliente: schedaRes.data.n_ordine_cliente || '',
            n_ordine_interno: schedaRes.data.n_ordine_interno || '',
            data_lavoro: schedaRes.data.data_lavoro,
            quantita: schedaRes.data.quantita || 0,
            quantita_effettiva: schedaRes.data.quantita_effettiva || 0,
            resa: schedaRes.data.resa || 0,
            note_generali: schedaRes.data.note_generali || '',
            formato_stampa: schedaRes.data.formato_stampa || '',
            formato_finito: schedaRes.data.formato_finito || '',
            operazioni: schedaRes.data.operazioni || [],
            note: schedaRes.data.note || '',
            problemi: schedaRes.data.problemi || '',
            stato: schedaRes.data.stato,
            tempo_stimato_totale: schedaRes.data.tempo_stimato_totale || 0
          });
        }
      } catch (e) {
        console.error('Error fetching data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEdit]);

  const addOperazione = (template) => {
    const newOp = {
      nome: template?.nome || 'Nuova Operazione',
      n_fogli: 0,
      n_colli: 0,
      tempo_effettivo: 0,
      completata: false
    };
    setFormData(prev => ({
      ...prev,
      operazioni: [...prev.operazioni, newOp]
    }));
    setShowOpMenu(false);
  };

  const removeOperazione = (index) => {
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

  // Mostra N. Colli solo per operazioni di confezione/impacchettamento
  const showColliField = (opName) => {
    const lower = opName.toLowerCase();
    return lower.includes('impacchett') || lower.includes('confezion') || lower.includes('colli');
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
        <div className="animate-pulse text-gray-500">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/schede')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-black uppercase tracking-tight text-gray-900">
              {isEdit ? 'Modifica Scheda' : 'Nuova Scheda'}
            </h1>
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
              formData.reparto === 'stampa' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {formData.reparto}
            </span>
          </div>
          <p className="text-gray-500 text-sm">Compila i dettagli della lavorazione</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Info */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Informazioni Generali</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Cliente *</label>
              <select
                data-testid="cliente-select"
                value={formData.cliente_id}
                onChange={(e) => setFormData(prev => ({ ...prev, cliente_id: e.target.value }))}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleziona cliente</option>
                {clienti.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Lavoro *</label>
              <input
                data-testid="lavoro-input"
                type="text"
                value={formData.lavoro}
                onChange={(e) => setFormData(prev => ({ ...prev, lavoro: e.target.value }))}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                placeholder="Es: Catalogo primavera"
                required
              />
            </div>

            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">N. Ordine Interno</label>
              <input
                data-testid="ordine-interno-input"
                type="text"
                value={formData.n_ordine_interno}
                onChange={(e) => setFormData(prev => ({ ...prev, n_ordine_interno: e.target.value }))}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                placeholder="Es: INT-001"
              />
            </div>

            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Data Lavoro</label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    data-testid="data-lavoro-trigger"
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 text-left flex items-center justify-between hover:border-gray-400 transition-colors"
                  >
                    <span>{format(new Date(formData.data_lavoro), 'dd MMMM yyyy', { locale: it })}</span>
                    <CalendarBlank size={18} className="text-gray-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border-gray-200" align="start">
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
                <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Stato</label>
                <select
                  data-testid="stato-select"
                  value={formData.stato}
                  onChange={(e) => setFormData(prev => ({ ...prev, stato: e.target.value }))}
                  className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="in_corso">In Corso</option>
                  <option value="completata">Completata</option>
                  <option value="sospesa">Sospesa</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Quantità</label>
              <input
                type="number"
                data-testid="quantita-input"
                value={formData.quantita || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, quantita: parseInt(e.target.value) || 0 }))}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                placeholder="Es: 1000"
              />
            </div>

            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Quantità Effettiva</label>
              <input
                type="number"
                data-testid="quantita-effettiva-input"
                value={formData.quantita_effettiva || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, quantita_effettiva: parseInt(e.target.value) || 0 }))}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                placeholder="Es: 980"
              />
            </div>

            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Resa</label>
              <input
                type="number"
                data-testid="resa-input"
                value={formData.resa || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, resa: parseInt(e.target.value) || 0 }))}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                placeholder="Es: 98"
              />
            </div>

            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Note</label>
              <input
                type="text"
                data-testid="note-generali-input"
                value={formData.note_generali || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, note_generali: e.target.value }))}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                placeholder="Note generali"
              />
            </div>

            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Formato Stampa</label>
              <input
                type="text"
                data-testid="formato-stampa-input"
                value={formData.formato_stampa || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, formato_stampa: e.target.value }))}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                placeholder="Es: 50x70"
              />
            </div>

            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Formato Finito</label>
              <input
                type="text"
                data-testid="formato-finito-input"
                value={formData.formato_finito || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, formato_finito: e.target.value }))}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                placeholder="Es: 21x29.7"
              />
            </div>
          </div>
        </div>

        {/* Operazioni */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-lg font-bold text-gray-900">Operazioni</h3>
            <div className="relative">
              <button
                type="button"
                data-testid="add-operazione-button"
                onClick={() => setShowOpMenu(!showOpMenu)}
                className="bg-blue-500 text-white font-bold rounded-lg px-4 py-2 hover:bg-blue-600 transition-colors flex items-center gap-2 text-sm"
              >
                <Plus size={16} weight="bold" />
                Aggiungi
                <CaretDown size={14} />
              </button>
              
              {showOpMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2">
                  {operazioniTemplate.map(op => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => addOperazione(op)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm transition-colors"
                    >
                      {op.nome}
                    </button>
                  ))}
                  <div className="h-px bg-gray-200 my-1"></div>
                  <button
                    type="button"
                    onClick={() => addOperazione(null)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-blue-500 text-sm transition-colors"
                  >
                    + Personalizzata
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Click outside to close menu */}
          {showOpMenu && (
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowOpMenu(false)}
            />
          )}

          {formData.operazioni.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500 text-sm">Nessuna operazione aggiunta</p>
              <p className="text-gray-400 text-xs mt-1">Clicca "Aggiungi" per inserire un'operazione</p>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.operazioni.map((op, index) => (
                <div 
                  key={index}
                  className={`border rounded-lg p-4 transition-all ${
                    op.completata 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <input
                      type="text"
                      value={op.nome}
                      onChange={(e) => updateOperazione(index, 'nome', e.target.value)}
                      className="bg-transparent border-none text-gray-900 font-semibold text-lg focus:outline-none focus:ring-0 p-0 flex-1"
                      placeholder="Nome operazione"
                    />
                    <div className="flex items-center gap-2">
                      {op.completata ? (
                        <button
                          type="button"
                          onClick={() => updateOperazione(index, 'completata', false)}
                          className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                        >
                          <Check size={18} weight="bold" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => updateOperazione(index, 'completata', true)}
                          className="p-2 rounded-lg border border-gray-300 text-gray-400 hover:bg-gray-100 transition-colors"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeOperazione(index)}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </div>

                  <div className={`grid gap-3 ${showColliField(op.nome) ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'}`}>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">N. Fogli</label>
                      <input
                        type="number"
                        value={op.n_fogli || ''}
                        onChange={(e) => updateOperazione(index, 'n_fogli', parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    {showColliField(op.nome) && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">N. Colli</label>
                        <input
                          type="number"
                          value={op.n_colli || ''}
                          onChange={(e) => updateOperazione(index, 'n_colli', parseInt(e.target.value) || 0)}
                          className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tempo Eff. (min)</label>
                      <input
                        type="number"
                        value={op.tempo_effettivo || ''}
                        onChange={(e) => updateOperazione(index, 'tempo_effettivo', parseInt(e.target.value) || 0)}
                        className="w-full bg-white border border-gray-200 text-gray-900 rounded-lg px-2 py-1.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tempo Stimato Totale */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Tempo Stimato</h3>
          <div className="max-w-xs">
            <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Tempo Stimato Totale (minuti)</label>
            <input
              type="number"
              data-testid="tempo-stimato-totale-input"
              value={formData.tempo_stimato_totale || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, tempo_stimato_totale: parseInt(e.target.value) || 0 }))}
              className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
              placeholder="Es: 120"
            />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
          <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Note e Problemi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Note</label>
              <textarea
                data-testid="note-textarea"
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                rows={4}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 resize-none"
                placeholder="Annotazioni generali..."
              />
            </div>
            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Problemi Riscontrati</label>
              <textarea
                data-testid="problemi-textarea"
                value={formData.problemi}
                onChange={(e) => setFormData(prev => ({ ...prev, problemi: e.target.value }))}
                rows={4}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 resize-none"
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
            className="border border-gray-300 text-gray-700 font-bold rounded-lg px-6 py-2.5 hover:bg-gray-50 transition-colors"
          >
            Annulla
          </button>
          <button
            type="submit"
            data-testid="save-scheda-button"
            disabled={saving}
            className="bg-blue-500 text-white font-bold rounded-lg px-6 py-2.5 hover:bg-blue-600 transition-colors flex items-center gap-2 disabled:opacity-50"
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
