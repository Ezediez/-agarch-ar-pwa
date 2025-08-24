import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, MessageSquare, User, Shield, Search, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Notifications from '@/components/Notifications';

const navItems = [
  { icon: Compass, text: 'Descubrir', path: '/' },
  { icon: MessageSquare, text: 'Chats', path: '/chat' },
  { icon: User, text: 'Perfil', path: '/profile' },
  { icon: Search, text: 'Buscar', path: '/search' },
  { icon: Settings, text: 'Ajustes', path: '/settings' },
];

const TopNavBar = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const activeLinkStyle = {
    color: 'rgb(var(--primary))',
    borderBottom: '2px solid rgb(var(--primary))',
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-surface border-b border-border-color p-2 flex justify-between items-center z-40">
       <div className="md:hidden flex-1 overflow-x-auto scrollbar-hide">
        <nav className="flex flex-nowrap space-x-6 px-2 py-1">
          {navItems.map((item) => (
            <NavLink
              key={item.text}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => (isActive ? activeLinkStyle : {})}
              className="flex flex-col items-center text-text-secondary hover:text-primary transition-colors pb-1 shrink-0"
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs mt-1 whitespace-nowrap">{item.text}</span>
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              style={({ isActive }) => (isActive ? activeLinkStyle : {})}
              className="flex flex-col items-center text-text-secondary hover:text-primary transition-colors pb-1 shrink-0"
            >
              <Shield className="w-6 h-6" />
              <span className="text-xs mt-1 whitespace-nowrap">Admin</span>
            </NavLink>
          )}
        </nav>
      </div>
      <div className="hidden md:flex flex-1 items-center justify-end">
         <Notifications />
      </div>
       <div className="md:hidden">
         <Notifications />
       </div>
    </div>
  );
};

export default TopNavBar;