import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, Home, MessageSquare, User, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { icon: Compass, text: 'Descubrir', path: '/discover' },
  { icon: Home, text: 'Publicaciones', path: '/' },
  { icon: MessageSquare, text: 'Chats', path: '/chat' },
  { icon: User, text: 'Perfil', path: '/profile' },
];

const BottomNavBar = () => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const activeLinkStyle = {
    color: 'rgb(var(--primary))',
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border-color p-2 flex justify-around items-center md:hidden z-40">
      {navItems.map((item) => (
        <NavLink
          key={item.text}
          to={item.path}
          end={item.path === '/'}
          style={({ isActive }) => (isActive ? activeLinkStyle : {})}
          className="flex flex-col items-center text-text-secondary hover:text-primary transition-colors"
        >
          <item.icon className="w-6 h-6" />
          <span className="text-xs mt-1">{item.text}</span>
        </NavLink>
      ))}
      {isAdmin && (
        <NavLink
          to="/admin"
          style={({ isActive }) => (isActive ? activeLinkStyle : {})}
          className="flex flex-col items-center text-text-secondary hover:text-primary transition-colors"
        >
          <Shield className="w-6 h-6" />
          <span className="text-xs mt-1">Admin</span>
        </NavLink>
      )}
    </div>
  );
};

export default BottomNavBar;