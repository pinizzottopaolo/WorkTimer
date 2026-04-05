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
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <header className="bg-[#141414] border-b border-white/10 sticky top-0 z-50">
        <div className="px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#007AFF] rounded-sm flex items-center justify-center">
                <Clock size={24} weight="bold" className="text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-heading text-lg font-black uppercase tracking-tight text-white">WorkTimer</h1>
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-[#007AFF] text-white' 
                        : 'text-white/60 hover:text-white hover:bg-white/5'
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
                  className="flex items-center gap-2 px-3 py-2 rounded-sm hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 bg-[#007AFF]/20 rounded-sm flex items-center justify-center">
                    <UserCircle size={20} className="text-[#007AFF]" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-white">{user?.name}</span>
                  <CaretDown size={14} className="text-white/50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#141414] border-white/10">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <p className="text-xs text-white/50">{user?.email}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-sm text-xs font-bold uppercase tracking-wider ${
                    user?.role === 'admin' ? 'bg-[#007AFF]/20 text-[#007AFF]' : 'bg-[#32D74B]/20 text-[#32D74B]'
                  }`}>
                    {user?.role}
                  </span>
                </div>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  data-testid="logout-button"
                  onClick={handleLogout}
                  className="text-[#FF3B30] focus:text-[#FF3B30] focus:bg-[#FF3B30]/10 cursor-pointer"
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
                className={`flex items-center gap-2 px-3 py-2 rounded-sm text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive 
                    ? 'bg-[#007AFF] text-white' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
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
