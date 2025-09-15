import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Home, MessageSquare, User, Settings, LogOut, Shield, Search } from 'lucide-react';

const navItems = [
  { icon: Home, text: 'Publicaciones', path: '/discover' },
  { icon: MessageSquare, text: 'Chats', path: '/chat' },
  { icon: User, text: 'Mi Perfil', path: '/my-profile' },
  { icon: Search, text: 'Buscar', path: '/search' },
  { icon: Settings, text: 'Ajustes', path: '/settings' },
];

const Sidebar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === 'admin';

  const handleLogout = async () => {
    await signOut();
    navigate('/landing');
  };

  const activeLinkStyle = {
    backgroundColor: 'rgba(var(--primary), 0.2)',
    color: 'rgb(var(--primary))',
    boxShadow: 'inset 3px 0 0 0 rgb(var(--primary))',
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface p-4 transition-all duration-300 shrink-0">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl font-bold text-center py-4 text-brand-red uppercase"
      >
        AGARCH-AR
      </motion.div>

      <nav className="flex flex-col space-y-2 mt-8 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.text}
            to={item.path}
            end={item.path === '/discover'}
            style={({ isActive }) => (isActive ? activeLinkStyle : {})}
            className="flex items-center px-4 py-3 text-text-secondary rounded-lg hover:bg-border-color hover:text-text-primary transition-colors"
          >
            <item.icon className="w-5 h-5 mr-4" />
            <span className="font-medium">{item.text}</span>
          </NavLink>
        ))}
         {isAdmin && (
          <NavLink
            to="/admin"
            style={({ isActive }) => (isActive ? activeLinkStyle : {})}
            className="flex items-center px-4 py-3 text-text-secondary rounded-lg hover:bg-border-color hover:text-text-primary transition-colors"
          >
            <Shield className="w-5 h-5 mr-4" />
            <span className="font-medium">Panel Admin</span>
          </NavLink>
        )}
      </nav>

      <div className="mt-auto">
        {user && (
          <div className="flex items-center p-2 mb-4">
            <img  
              className="w-10 h-10 rounded-full object-cover mr-3" 
              alt={profile?.alias || 'User avatar'}
             src={profile?.profile_picture_url || '/pwa-512x512.png'} />
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold text-text-primary truncate">{profile?.alias || 'Usuario'}</p>
              <p className="text-sm text-text-secondary truncate">{user.email}</p>
            </div>
          </div>
        )}
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-text-secondary hover:text-destructive">
          <LogOut className="w-5 h-5 mr-4" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
