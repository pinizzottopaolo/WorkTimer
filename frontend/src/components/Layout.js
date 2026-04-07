import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Clock, House, Files, Users, ChartBar, Gear, SignOut, 
  UserCircle, List, CaretDown
} from '@phosphor-icons/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: House },
    { path: '/schede', label: 'Schede Lavoro', icon: Files },
    { path: '/clienti', label: 'Clienti', icon: Users },
    { path: '/operazioni', label: 'Operazioni', icon: List },
    { path: '/report', label: 'Report', icon: ChartBar },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Admin', icon: Gear });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Clock size={24} weight="bold" className="text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-heading text-lg font-black uppercase tracking-tight text-gray-900">WorkTimer</h1>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-blue-500 text-white' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} weight={isActive ? 'fill' : 'regular'} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  data-testid="user-menu-trigger"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserCircle size={20} className="text-blue-500" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name}</span>
                  <CaretDown size={14} className="text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                    user?.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {user?.role}
                  </span>
                </div>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuItem 
                  data-testid="logout-button"
                  onClick={handleLogout}
                  className="text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer"
                >
                  <SignOut size={16} className="mr-2" />
                  Esci
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center gap-1 px-4 pb-3 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon size={16} weight={isActive ? 'fill' : 'regular'} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
