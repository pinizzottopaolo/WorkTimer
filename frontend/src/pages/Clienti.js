import React, { useState, useEffect, useMemo } from 'react';
import { getClienti, createCliente, updateCliente, deleteCliente } from '../services/api';
import { Plus, PencilSimple, Trash, Check, User, CaretDown, CaretRight } from '@phosphor-icons/react';
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

const Clienti = () => {
  const [clienti, setClienti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [expandedLetters, setExpandedLetters] = useState({});
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefono: '',
    indirizzo: ''
  });

  const fetchClienti = async () => {
    try {
      const res = await getClienti();
      setClienti(res.data);
      // Espandi tutte le lettere di default
      const letters = {};
      res.data.forEach(c => {
        const letter = c.nome.charAt(0).toUpperCase();
        letters[letter] = true;
      });
      setExpandedLetters(letters);
    } catch (e) {
      console.error('Error fetching clienti:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClienti();
  }, []);

  // Raggruppa clienti per lettera iniziale
  const groupedClienti = useMemo(() => {
    const groups = {};
    clienti.forEach(cliente => {
      const letter = cliente.nome.charAt(0).toUpperCase();
      if (!groups[letter]) {
        groups[letter] = [];
      }
      groups[letter].push(cliente);
    });
    // Ordina le lettere alfabeticamente
    const sortedGroups = {};
    Object.keys(groups).sort().forEach(letter => {
      sortedGroups[letter] = groups[letter].sort((a, b) => a.nome.localeCompare(b.nome));
    });
    return sortedGroups;
  }, [clienti]);

  const toggleLetter = (letter) => {
    setExpandedLetters(prev => ({
      ...prev,
      [letter]: !prev[letter]
    }));
  };

  const openForm = (cliente = null) => {
    if (cliente) {
      setEditId(cliente.id);
      setFormData({
        nome: cliente.nome,
        email: cliente.email || '',
        telefono: cliente.telefono || '',
        indirizzo: cliente.indirizzo || ''
      });
    } else {
      setEditId(null);
      setFormData({ nome: '', email: '', telefono: '', indirizzo: '' });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) return;

    try {
      if (editId) {
        await updateCliente(editId, formData);
      } else {
        await createCliente(formData);
      }
      setShowForm(false);
      fetchClienti();
    } catch (e) {
      console.error('Error saving cliente:', e);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCliente(deleteId);
      setDeleteId(null);
      fetchClienti();
    } catch (e) {
      console.error('Error deleting cliente:', e);
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
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">
            Clienti
          </h1>
          <p className="text-gray-500 text-sm mt-1">{clienti.length} clienti registrati</p>
        </div>
        <button
          onClick={() => openForm()}
          data-testid="add-cliente-button"
          className="bg-blue-500 text-white font-bold rounded-lg px-4 py-2 hover:bg-blue-600 transition-colors flex items-center gap-2 w-fit text-sm"
        >
          <Plus size={16} weight="bold" />
          Nuovo Cliente
        </button>
      </div>

      {/* Lista raggruppata alfabeticamente */}
      {clienti.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
          <User size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Nessun cliente registrato</p>
          <button
            onClick={() => openForm()}
            className="text-blue-500 hover:text-blue-600 font-medium inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Aggiungi il primo cliente
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.keys(groupedClienti).map((letter) => (
            <div key={letter} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              {/* Intestazione lettera */}
              <button
                onClick={() => toggleLetter(letter)}
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                    {letter}
                  </span>
                  <span className="text-gray-600 text-sm font-medium">
                    {groupedClienti[letter].length} client{groupedClienti[letter].length === 1 ? 'e' : 'i'}
                  </span>
                </div>
                {expandedLetters[letter] ? (
                  <CaretDown size={16} className="text-gray-400" />
                ) : (
                  <CaretRight size={16} className="text-gray-400" />
                )}
              </button>

              {/* Lista clienti */}
              {expandedLetters[letter] && (
                <div className="divide-y divide-gray-100">
                  {groupedClienti[letter].map((cliente) => (
                    <div 
                      key={cliente.id}
                      className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-7 h-7 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                          <User size={14} className="text-blue-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm truncate">{cliente.nome}</p>
                          {cliente.telefono && (
                            <p className="text-xs text-gray-400 truncate">{cliente.telefono}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                        <button
                          onClick={() => openForm(cliente)}
                          data-testid={`edit-cliente-${cliente.id}`}
                          className="p-1.5 rounded hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600"
                        >
                          <PencilSimple size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(cliente.id)}
                          data-testid={`delete-cliente-${cliente.id}`}
                          className="p-1.5 rounded hover:bg-red-100 transition-colors text-gray-400 hover:text-red-500"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-white border-gray-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 font-heading">
              {editId ? 'Modifica Cliente' : 'Nuovo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Nome *</label>
              <input
                data-testid="cliente-nome-input"
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                placeholder="Nome azienda/cliente"
                required
              />
            </div>
            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Email</label>
              <input
                data-testid="cliente-email-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                placeholder="email@esempio.com"
              />
            </div>
            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Telefono</label>
              <input
                data-testid="cliente-telefono-input"
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                placeholder="+39 123 456 7890"
              />
            </div>
            <div>
              <label className="block text-xs tracking-wider uppercase font-bold text-gray-500 mb-2">Indirizzo</label>
              <input
                data-testid="cliente-indirizzo-input"
                type="text"
                value={formData.indirizzo}
                onChange={(e) => setFormData(prev => ({ ...prev, indirizzo: e.target.value }))}
                className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-400"
                placeholder="Via Roma 1, Milano"
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
                data-testid="save-cliente-button"
                className="bg-blue-500 text-white font-bold rounded-lg px-5 py-2 hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Check size={16} weight="bold" />
                {editId ? 'Salva' : 'Crea'}
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
              Sei sicuro di voler eliminare questo cliente? Questa azione non può essere annullata.
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

export default Clienti;
