import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Users, ShieldCheck, Clapperboard } from 'lucide-react';

const StatCard = ({ title, value, icon, loading }) => {
  return (
    <div className="card-glass p-6 rounded-lg flex items-center space-x-4">
      <div className="bg-primary/20 p-3 rounded-full">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-text-secondary">{title}</h2>
        {loading ? (
          <div className="h-10 w-20 bg-gray-700/50 animate-pulse rounded-md mt-1" />
        ) : (
          <p className="text-4xl font-bold mt-1 text-primary">{value}</p>
        )}
      </div>
    </div>
  );
};

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_dashboard_stats')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching dashboard stats:', error);
        toast({
          variant: 'destructive',
          title: 'Error al cargar estadísticas',
          description: 'No se pudieron obtener los datos del dashboard.',
        });
      } else {
        setStats(data);
      }
      setLoading(false);
    };

    fetchStats();
  }, [toast]);

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - AGARCH-AR</title>
        <meta name="description" content="Panel de administración para gestionar usuarios, anuncios y ver estadísticas." />
      </Helmet>
      <div>
        <h1 className="text-3xl font-bold text-primary mb-4">Dashboard de Administración</h1>
        <p className="text-text-secondary">Bienvenido al centro de control de la aplicación.</p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard 
            title="Usuarios Totales" 
            value={stats?.total_profiles ?? '--'} 
            icon={<Users className="w-8 h-8 text-primary" />}
            loading={loading}
          />
          <StatCard 
            title="Usuarios VIP" 
            value={stats?.vip_profiles ?? '--'} 
            icon={<ShieldCheck className="w-8 h-8 text-primary" />}
            loading={loading}
          />
          <StatCard 
            title="Anuncios Activos" 
            value={stats?.active_ads ?? '--'} 
            icon={<Clapperboard className="w-8 h-8 text-primary" />}
            loading={loading}
          />
        </div>
        
        <div className="mt-8 card-glass p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
          <p className="text-text-secondary">🚧 ¡Más funcionalidades y gráficos próximamente! 🚧</p>
        </div>
      </div>
    </>
  );
};

export default AdminDashboardPage;