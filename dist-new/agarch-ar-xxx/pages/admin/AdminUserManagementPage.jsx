import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '@/lib/firebase'; // 🔥 Firebase client
import { collection, getDocs, doc, updateDoc, orderBy, query, deleteDoc } from 'firebase/firestore';
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
        try {
            const profilesRef = collection(db, 'profiles');
            const profilesQuery = query(profilesRef, orderBy('created_at', 'desc'));
            
            const snapshot = await getDocs(profilesQuery);
            let allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Filtrar por término de búsqueda en el cliente
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                allUsers = allUsers.filter(user => 
                    user.email?.toLowerCase().includes(searchLower) ||
                    user.alias?.toLowerCase().includes(searchLower) ||
                    user.nombre_completo?.toLowerCase().includes(searchLower)
                );
            }
            
            // Aplicar paginación
            const startIndex = page * USERS_PER_PAGE;
            const endIndex = startIndex + USERS_PER_PAGE;
            const paginatedUsers = allUsers.slice(startIndex, endIndex);
            
            setUsers(paginatedUsers);
            setCount(allUsers.length);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar los usuarios." });
            setUsers([]);
            setCount(0);
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
        const profileRef = doc(db, 'profiles', id);
        await updateDoc(profileRef, updateData);
        
        toast({ title: "Éxito", description: "Usuario actualizado correctamente." });
        setEditingUser(null);
        fetchUsers();
    };
    
    const handleDelete = async (userId) => {
         if (window.confirm('¿Estás seguro de que quieres eliminar a este usuario de forma permanente? Esta acción no se puede deshacer.')) {
            // Eliminar usuario de Firebase
            const userRef = doc(db, 'profiles', userId);
            await deleteDoc(userRef);
            
            toast({ title: "Éxito", description: "Usuario eliminado correctamente." });
            fetchUsers();
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
