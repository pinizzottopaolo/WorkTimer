import React, { useState, useEffect } from 'react';
import { getOperazioniTemplate, createOperazioneTemplate, deleteOperazioneTemplate } from '../services/api';
import { Plus, Trash, List, Check } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
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

const Operazioni = () => {
  const [operazioni, setOperazioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descrizione: ''
  });

  const fetchOperazioni = async () => {
    try {
      const res = await getOperazioniTemplate();
      setOperazioni(res.data);
    } catch (e) {
      console.error('Error fetching operazioni:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperazioni();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    try {
      await createOperazioneTemplate(formData);
      setShowForm(false);
      setFormData({ nome: '', descrizione: '' });
      fetchOperazioni();
    } catch (e) {
      console.error('Error creating operazione:', e);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteOperazioneTemplate(deleteId);
      setDeleteId(null);
      fetchOperazioni();
    } catch (e) {
      console.error('Error deleting operazione:', e);
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
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">
            Operazioni
          </h1>
          <p className="text-gray-500 text-sm mt-1">Template operazioni disponibili</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          data-testid="add-operazione-button"
          className="bg-blue-500 text-white font-bold rounded-lg px-5 py-2.5 hover:bg-blue-600 transition-colors flex items-center gap-2 w-fit"
        >
          <Plus size={18} weight="bold" />
          Nuova Operazione
        </button>
      </div>

      {/* List */}
      {operazioni.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
          <List size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Nessuna operazione template</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-blue-500 hover:text-blue-600 font-medium inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Aggiungi la prima operazione
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="divide-y divide-gray-100">
            {operazioni.map((op, index) => (
              <div 
                key={op.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-semibold">{op.nome}</h3>
                    {op.descrizione && (
                      <p className="text-gray-500 text-sm">{op.descrizione}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setDeleteId(op.id)}
                  data-testid={`delete-operazione-${op.id}`}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
                >
                  <Trash size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-white border-gray-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 font-heading">Nuova Operazione</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Nome *</label>
              <input
                data-testid="operazione-nome-input"
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                placeholder="Es: Taglio, Rilegatura..."
                required
              />
            </div>
            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Descrizione</label>
              <textarea
                data-testid="operazione-descrizione-input"
                value={formData.descrizione}
                onChange={(e) => setFormData(prev => ({ ...prev, descrizione: e.target.value }))}
                rows={3}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400 resize-none"
                placeholder="Descrizione opzionale..."
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-gray-300 text-gray-700 font-bold rounded-lg px-5 py-2 hover:bg-gray-50 transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                data-testid="save-operazione-button"
                className="bg-blue-500 text-white font-bold rounded-lg px-5 py-2 hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Check size={16} weight="bold" />
                Crea
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Sei sicuro di voler eliminare questa operazione template?
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

export default Operazioni;
