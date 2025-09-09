import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { db, auth, storage } from '@/lib/firebase'; // 🔥 Firebase client
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, ShieldCheck, Clapperboard, AlertTriangle, FileText, Settings, Filter, Download, BarChart3, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const [filters, setFilters] = useState({
    country: '',
    zone: '',
    ageRange: '',
    userType: ''
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Simular estadísticas mientras se configura Firebase
        const mockStats = {
          total_profiles: 1247,
          vip_profiles: 89,
          active_ads: 23,
          total_reports: 12,
          verified_users: 156,
          new_users_today: 8
        };
        
        setTimeout(() => {
          setStats(mockStats);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        toast({
          variant: 'destructive',
          title: 'Error al cargar estadísticas',
          description: 'No se pudieron obtener los datos del dashboard.',
        });
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportReport = (type) => {
    toast({
      title: "Exportando Reporte",
      description: `Generando reporte de ${type}...`,
    });
    
    // Simular descarga
    setTimeout(() => {
      toast({
        title: "Reporte Generado",
        description: `El reporte de ${type} se ha descargado exitosamente.`,
      });
    }, 2000);
  };

  const handleDenunciasEmail = () => {
    const emailBody = `Revisar denuncias pendientes en el panel de administración de AGARCH-AR.
    
Acceso: ${window.location.origin}/admin
Fecha: ${new Date().toLocaleString()}`;

    const mailtoLink = `mailto:denuncias@agarch-ar.com?subject=Denuncias Pendientes - AGARCH-AR&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
  };

  return (
    <>
      <Helmet>
        <title>Admin Dashboard - AGARCH-AR</title>
        <meta name="description" content="Panel de administración para gestionar usuarios, anuncios y ver estadísticas." />
      </Helmet>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-4">Dashboard de Administración</h1>
          <p className="text-text-secondary">Centro de control completo de la aplicación</p>
        </div>

        {/* Filtros de Búsqueda */}
        <div className="card-glass p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-primary flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros de Consulta
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">País</label>
              <Select value={filters.country} onValueChange={(value) => handleFilterChange('country', value)}>
                <SelectTrigger className="input-glass">
                  <SelectValue placeholder="Seleccionar país" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="argentina">Argentina</SelectItem>
                  <SelectItem value="uruguay">Uruguay</SelectItem>
                  <SelectItem value="chile">Chile</SelectItem>
                  <SelectItem value="paraguay">Paraguay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Zona/Región</label>
              <Select value={filters.zone} onValueChange={(value) => handleFilterChange('zone', value)}>
                <SelectTrigger className="input-glass">
                  <SelectValue placeholder="Seleccionar zona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="caba">CABA</SelectItem>
                  <SelectItem value="buenos-aires">Buenos Aires</SelectItem>
                  <SelectItem value="cordoba">Córdoba</SelectItem>
                  <SelectItem value="rosario">Rosario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rango de Edad</label>
              <Select value={filters.ageRange} onValueChange={(value) => handleFilterChange('ageRange', value)}>
                <SelectTrigger className="input-glass">
                  <SelectValue placeholder="Seleccionar edad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18-25">18-25 años</SelectItem>
                  <SelectItem value="26-35">26-35 años</SelectItem>
                  <SelectItem value="36-45">36-45 años</SelectItem>
                  <SelectItem value="46+">46+ años</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Usuario</label>
              <Select value={filters.userType} onValueChange={(value) => handleFilterChange('userType', value)}>
                <SelectTrigger className="input-glass">
                  <SelectValue placeholder="Tipo usuario" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="verified">Verificados</SelectItem>
                  <SelectItem value="regular">Regulares</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <StatCard 
            title="Denuncias Pendientes" 
            value={stats?.total_reports ?? '--'} 
            icon={<AlertTriangle className="w-8 h-8 text-red-500" />}
            loading={loading}
          />
          <StatCard 
            title="Usuarios Verificados" 
            value={stats?.verified_users ?? '--'} 
            icon={<ShieldCheck className="w-8 h-8 text-green-500" />}
            loading={loading}
          />
          <StatCard 
            title="Nuevos Hoy" 
            value={stats?.new_users_today ?? '--'} 
            icon={<Users className="w-8 h-8 text-blue-500" />}
            loading={loading}
          />
        </div>
        
        {/* Acciones Rápidas */}
        <div className="card-glass p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-primary">Gestión y Reportes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              onClick={() => navigate('/admin/users')} 
              className="flex items-center justify-center p-4 h-auto bg-blue-600 hover:bg-blue-700"
            >
              <Users className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Gestionar Usuarios</div>
                <div className="text-sm opacity-90">Altas, bajas, auditorías</div>
              </div>
            </Button>
            
            <Button 
              onClick={handleDenunciasEmail}
              className="flex items-center justify-center p-4 h-auto bg-red-600 hover:bg-red-700"
            >
              <AlertTriangle className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Denuncias</div>
                <div className="text-sm opacity-90">Revisar reportes</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => exportReport('usuarios')}
              className="flex items-center justify-center p-4 h-auto bg-green-600 hover:bg-green-700"
            >
              <Download className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Exportar Datos</div>
                <div className="text-sm opacity-90">Reportes y métricas</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => navigate('/admin/ads')}
              className="flex items-center justify-center p-4 h-auto bg-purple-600 hover:bg-purple-700"
            >
              <Clapperboard className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Publicidad</div>
                <div className="text-sm opacity-90">Gestionar anuncios</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => exportReport('estadísticas')}
              className="flex items-center justify-center p-4 h-auto bg-yellow-600 hover:bg-yellow-700"
            >
              <BarChart3 className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Estadísticas</div>
                <div className="text-sm opacity-90">Métricas detalladas</div>
              </div>
            </Button>
            
            <Button 
              onClick={() => toast({ title: "Configuración", description: "Panel de configuración de usuarios internos próximamente" })}
              className="flex items-center justify-center p-4 h-auto bg-gray-600 hover:bg-gray-700"
            >
              <Settings className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Usuarios Internos</div>
                <div className="text-sm opacity-90">Roles y permisos</div>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboardPage;
