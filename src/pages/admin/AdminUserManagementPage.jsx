import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient'; // 🔥 Firebase client
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Save, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const AdminUserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [count, setCount] = useState(0);
    const { toast } = useToast();
    const USERS_PER_PAGE = 10;

    useEffect(() => {
        fetchUsers();
    }, [page, searchTerm]);

    const fetchUsers = async () => {
        setLoading(true);
        let query = supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(page * USERS_PER_PAGE, (page + 1) * USERS_PER_PAGE - 1);

        if (searchTerm) {
            query = query.or(`email.ilike.%${searchTerm}%,alias.ilike.%${searchTerm}%,nombre_completo.ilike.%${searchTerm}%`);
        }

        const { data, error, count } = await query;
        
        if (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los usuarios." });
        } else {
            setUsers(data);
            setCount(count);
        }
        setLoading(false);
    };

    const handleEdit = (user) => {
        setEditingUser({ ...user });
    };

    const handleCancel = () => {
        setEditingUser(null);
    };

    const handleSave = async () => {
        const { id, ...updateData } = editingUser;
        const { error } = await supabase.from('profiles').update(updateData).eq('id', id);
        if (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el usuario." });
        } else {
            toast({ title: "Éxito", description: "Usuario actualizado correctamente." });
            setEditingUser(null);
            fetchUsers();
        }
    };
    
    const handleDelete = async (userId) => {
         if (window.confirm('¿Estás seguro de que quieres eliminar a este usuario de forma permanente? Esta acción no se puede deshacer.')) {
            const { error } = await supabase.rpc('delete_user_by_id_admin', { user_id_to_delete: userId });
            if (error) {
                toast({ variant: "destructive", title: "Error", description: `No se pudo eliminar el usuario: ${error.message}` });
            } else {
                toast({ title: "Éxito", description: "Usuario eliminado correctamente." });
                fetchUsers();
            }
        }
    };
    
    const handleInputChange = (e, field) => {
        setEditingUser({ ...editingUser, [field]: e.target.value });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(0);
        fetchUsers();
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Gestión de Usuarios</h1>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <Input 
                    placeholder="Buscar por email, alias o nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit"><Search className="h-4 w-4 mr-2"/> Buscar</Button>
            </form>
            <div className="bg-surface rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Alias</th>
                                <th scope="col" className="px-6 py-3">Email</th>
                                <th scope="col" className="px-6 py-3">Nombre Completo</th>
                                <th scope="col" className="px-6 py-3">Rol</th>
                                <th scope="col" className="px-6 py-3">Verificado</th>
                                <th scope="col" className="px-6 py-3">VIP</th>
                                <th scope="col" className="px-6 py-3">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="text-center p-4">Cargando...</td></tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                        {editingUser?.id === user.id ? (
                                            <>
                                                <td className="px-6 py-4"><Input value={editingUser.alias} onChange={(e) => handleInputChange(e, 'alias')} /></td>
                                                <td className="px-6 py-4"><Input value={editingUser.email} onChange={(e) => handleInputChange(e, 'email')} /></td>
                                                <td className="px-6 py-4"><Input value={editingUser.nombre_completo} onChange={(e) => handleInputChange(e, 'nombre_completo')} /></td>
                                                <td className="px-6 py-4"><Input value={editingUser.role} onChange={(e) => handleInputChange(e, 'role')} /></td>
                                                <td className="px-6 py-4"><Input type="checkbox" checked={editingUser.is_verified} onChange={(e) => setEditingUser({...editingUser, is_verified: e.target.checked})} /></td>
                                                <td className="px-6 py-4"><Input type="checkbox" checked={editingUser.is_vip} onChange={(e) => setEditingUser({...editingUser, is_vip: e.target.checked})} /></td>
                                                <td className="px-6 py-4 flex gap-2">
                                                    <Button size="sm" onClick={handleSave}><Save className="h-4 w-4"/></Button>
                                                    <Button size="sm" variant="outline" onClick={handleCancel}><X className="h-4 w-4"/></Button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{user.alias}</td>
                                                <td className="px-6 py-4">{user.email}</td>
                                                <td className="px-6 py-4">{user.nombre_completo}</td>
                                                <td className="px-6 py-4">{user.role}</td>
                                                <td className="px-6 py-4">{user.is_verified ? 'Sí' : 'No'}</td>
                                                <td className="px-6 py-4">{user.is_vip ? 'Sí' : 'No'}</td>
                                                <td className="px-6 py-4 flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => handleEdit(user)}><Edit className="h-4 w-4"/></Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(user.id)}><Trash2 className="h-4 w-4"/></Button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                 <div className="flex justify-between items-center p-4">
                    <span className="text-sm text-gray-700">
                        Mostrando {page * USERS_PER_PAGE + 1} a {Math.min((page + 1) * USERS_PER_PAGE, count)} de {count} usuarios
                    </span>
                    <div className="flex gap-2">
                        <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft className="h-4 w-4"/> Anterior</Button>
                        <Button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * USERS_PER_PAGE >= count}>Siguiente <ChevronRight className="h-4 w-4"/></Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUserManagementPage;