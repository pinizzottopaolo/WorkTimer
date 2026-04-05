import React, { useState, useEffect } from 'react';
import { getClienti, createCliente, updateCliente, deleteCliente } from '../services/api';
import { Plus, PencilSimple, Trash, X, Check, User, Envelope, Phone, MapPin } from '@phosphor-icons/react';
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
    } catch (e) {
      console.error('Error fetching clienti:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClienti();
  }, []);

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
            Clienti
          </h1>
          <p className="text-white/50 text-sm mt-1">{clienti.length} clienti registrati</p>
        </div>
        <button
          onClick={() => openForm()}
          data-testid="add-cliente-button"
          className="bg-[#007AFF] text-white font-bold rounded-sm px-5 py-2.5 hover:bg-[#3395FF] transition-colors flex items-center gap-2 w-fit"
        >
          <Plus size={18} weight="bold" />
          Nuovo Cliente
        </button>
      </div>

      {/* Grid */}
      {clienti.length === 0 ? (
        <div className="bg-[#141414] border border-white/10 rounded-sm p-12 text-center">
          <User size={48} className="text-white/20 mx-auto mb-4" />
          <p className="text-white/50 mb-4">Nessun cliente registrato</p>
          <button
            onClick={() => openForm()}
            className="text-[#007AFF] hover:text-[#3395FF] font-medium inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Aggiungi il primo cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clienti.map((cliente) => (
            <div 
              key={cliente.id}
              className="bg-[#141414] border border-white/10 rounded-sm p-5 card-hover"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#007AFF]/20 rounded-sm flex items-center justify-center">
                    <User size={20} className="text-[#007AFF]" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white">{cliente.nome}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openForm(cliente)}
                    data-testid={`edit-cliente-${cliente.id}`}
                    className="p-2 rounded-sm hover:bg-white/10 transition-colors text-white/50 hover:text-white"
                  >
                    <PencilSimple size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteId(cliente.id)}
                    data-testid={`delete-cliente-${cliente.id}`}
                    className="p-2 rounded-sm hover:bg-[#FF3B30]/10 transition-colors text-white/50 hover:text-[#FF3B30]"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {cliente.email && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Envelope size={14} />
                    <span>{cliente.email}</span>
                  </div>
                )}
                {cliente.telefono && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Phone size={14} />
                    <span>{cliente.telefono}</span>
                  </div>
                )}
                {cliente.indirizzo && (
                  <div className="flex items-center gap-2 text-white/60">
                    <MapPin size={14} />
                    <span>{cliente.indirizzo}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-[#141414] border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-heading">
              {editId ? 'Modifica Cliente' : 'Nuovo Cliente'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-xs tracking-[0.2em] uppercase font-bold text-white/50 mb-2">Nome *</label>
              <input
                data-testid="cliente-nome-input"
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white rounded-sm px-3 py-2.5 focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] placeholder:text-white/30"
                placeholder="Nome azienda/cliente"
                required
              />
            </div>
            <div>
              <label className="block text-xs tracking-[0.2em] uppercase font-bold text-white/50 mb-2">Email</label>
              <input
                data-testid="cliente-email-input"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white rounded-sm px-3 py-2.5 focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] placeholder:text-white/30"
                placeholder="email@esempio.com"
              />
            </div>
            <div>
              <label className="block text-xs tracking-[0.2em] uppercase font-bold text-white/50 mb-2">Telefono</label>
              <input
                data-testid="cliente-telefono-input"
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white rounded-sm px-3 py-2.5 focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] placeholder:text-white/30"
                placeholder="+39 123 456 7890"
              />
            </div>
            <div>
              <label className="block text-xs tracking-[0.2em] uppercase font-bold text-white/50 mb-2">Indirizzo</label>
              <input
                data-testid="cliente-indirizzo-input"
                type="text"
                value={formData.indirizzo}
                onChange={(e) => setFormData(prev => ({ ...prev, indirizzo: e.target.value }))}
                className="w-full bg-[#0A0A0A] border border-white/20 text-white rounded-sm px-3 py-2.5 focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF] placeholder:text-white/30"
                placeholder="Via Roma 1, Milano"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-white/20 text-white font-bold rounded-sm px-5 py-2 hover:bg-white/5 transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                data-testid="save-cliente-button"
                className="bg-[#007AFF] text-white font-bold rounded-sm px-5 py-2 hover:bg-[#3395FF] transition-colors flex items-center gap-2"
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
        <AlertDialogContent className="bg-[#141414] border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Sei sicuro di voler eliminare questo cliente? Questa azione non può essere annullata.
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

export default Clienti;
