import React, { useState, useEffect } from 'react';
import { getUsers, updateUserRole } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { User, Shield, UserCircle, Check } from '@phosphor-icons/react';

const Admin = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (e) {
      console.error('Error updating role:', e);
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
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
          Gestione Utenti
        </h1>
        <p className="text-white/50 text-sm mt-1">{users.length} utenti registrati</p>
      </div>

      {/* Users Table */}
      <div className="bg-[#141414] border border-white/10 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs tracking-[0.1em] uppercase font-bold text-white/50 px-4 py-3">Utente</th>
                <th className="text-left text-xs tracking-[0.1em] uppercase font-bold text-white/50 px-4 py-3">Email</th>
                <th className="text-left text-xs tracking-[0.1em] uppercase font-bold text-white/50 px-4 py-3">Ruolo</th>
                <th className="text-right text-xs tracking-[0.1em] uppercase font-bold text-white/50 px-4 py-3">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-sm flex items-center justify-center ${
                        user.role === 'admin' ? 'bg-[#007AFF]/20' : 'bg-white/10'
                      }`}>
                        {user.role === 'admin' ? (
                          <Shield size={20} className="text-[#007AFF]" />
                        ) : (
                          <UserCircle size={20} className="text-white/60" />
                        )}
                      </div>
                      <span className="text-white font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-white/70">{user.email}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-sm text-xs font-bold uppercase tracking-wider ${
                      user.role === 'admin' 
                        ? 'bg-[#007AFF]/20 text-[#007AFF]' 
                        : 'bg-[#32D74B]/20 text-[#32D74B]'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    {user.id !== currentUser?.id ? (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        data-testid={`role-select-${user.id}`}
                        className="bg-[#0A0A0A] border border-white/20 text-white rounded-sm px-3 py-1.5 text-sm focus:ring-1 focus:ring-[#007AFF] focus:border-[#007AFF]"
                      >
                        <option value="operatore">Operatore</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className="text-white/40 text-sm italic">Tu</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
