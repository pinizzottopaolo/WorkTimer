import React, { useState, useEffect } from 'react';
import { getUsers, updateUserRole } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Shield, UserCircle } from '@phosphor-icons/react';

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
        <div className="animate-pulse text-gray-500">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-900">
          Gestione Utenti
        </h1>
        <p className="text-gray-500 text-sm mt-1">{users.length} utenti registrati</p>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs tracking-wider uppercase font-bold text-gray-500 px-4 py-3">Utente</th>
                <th className="text-left text-xs tracking-wider uppercase font-bold text-gray-500 px-4 py-3">Email</th>
                <th className="text-left text-xs tracking-wider uppercase font-bold text-gray-500 px-4 py-3">Ruolo</th>
                <th className="text-right text-xs tracking-wider uppercase font-bold text-gray-500 px-4 py-3">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        user.role === 'admin' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {user.role === 'admin' ? (
                          <Shield size={20} className="text-blue-500" />
                        ) : (
                          <UserCircle size={20} className="text-gray-500" />
                        )}
                      </div>
                      <span className="text-gray-900 font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600">{user.email}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      user.role === 'admin' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-green-100 text-green-600'
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
                        className="bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="operatore">Operatore</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className="text-gray-400 text-sm italic">Tu</span>
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
