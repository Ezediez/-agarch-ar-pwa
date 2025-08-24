import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Clapperboard, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const navItems = [
  { icon: LayoutDashboard, text: 'Dashboard', path: '/admin' },
  { icon: Users, text: 'Usuarios', path: '/admin/users' },
  { icon: Clapperboard, text: 'Publicidad', path: '/admin/ads' },
];

const AdminSidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/landing');
  };

  const activeLinkStyle = {
    backgroundColor: 'rgba(var(--primary), 0.2)',
    color: 'rgb(var(--primary))',
    boxShadow: 'inset 3px 0 0 0 rgb(var(--primary))',
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-surface p-4 shrink-0">
      <div className="text-2xl font-bold text-center py-4 text-brand-red uppercase">
        ADMIN
      </div>
      <nav className="flex flex-col space-y-2 mt-8 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.text}
            to={item.path}
            end={item.path === '/admin'}
            style={({ isActive }) => (isActive ? activeLinkStyle : {})}
            className="flex items-center px-4 py-3 text-text-secondary rounded-lg hover:bg-border-color hover:text-text-primary transition-colors"
          >
            <item.icon className="w-5 h-5 mr-4" />
            <span className="font-medium">{item.text}</span>
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto">
        <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-text-secondary hover:text-destructive">
          <LogOut className="w-5 h-5 mr-4" />
          Cerrar Sesión
        </Button>
      </div>
    </aside>
  );
};

export default AdminSidebar;