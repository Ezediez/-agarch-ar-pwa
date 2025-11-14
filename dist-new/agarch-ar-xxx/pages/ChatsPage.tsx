import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import {
  collection, query, where, orderBy, onSnapshot, doc, getDoc
} from "firebase/firestore";

export default function ChatsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<{[key: string]: any}>({});
  const uid = auth.currentUser?.uid;

  // Función para cargar perfil de un usuario
  const loadProfile = async (userId: string) => {
    if (profiles[userId]) return profiles[userId];
    
    try {
      const profileRef = doc(db, 'profiles', userId);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const profileData = { id: profileSnap.id, ...profileSnap.data() };
        setProfiles(prev => ({ ...prev, [userId]: profileData }));
        return profileData;
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
    return { alias: 'Usuario', profile_picture_url: '/pwa-512x512.png' };
  };

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "conversations"),
      where("members", "array-contains", uid),
      orderBy("updatedAt", "desc")
    );
    const unsub = onSnapshot(q, async (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Cargar perfiles para cada conversación
      for (const row of rows) {
        const otherMemberId = row.members.find((id: string) => id !== uid);
        if (otherMemberId) {
          await loadProfile(otherMemberId);
        }
      }
      
      setItems(rows);
    });
    return () => unsub();
  }, [uid]);

  if (!uid) return <div className="p-6 text-center">Inicia sesión…</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-green-400 mb-4">Chats</h1>
      <input className="w-full rounded-lg bg-slate-800 text-white p-3 mb-4"
             placeholder="Buscar chats…" />
      <div className="space-y-2">
        {items.map(c => {
          const otherMemberId = c.members.find((id: string) => id !== uid);
          const otherProfile = profiles[otherMemberId] || { alias: 'Usuario', profile_picture_url: '/pwa-512x512.png' };
          
          return (
            <Link key={c.id}
              to={`/chat/${c.id}`}
              className="block rounded-xl bg-slate-800 hover:bg-slate-700 p-4 text-white">
              <div className="flex items-center space-x-3">
                <img 
                  src={otherProfile.profile_picture_url} 
                  alt={otherProfile.alias}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/pwa-512x512.png';
                  }}
                />
                <div className="flex-1">
                  <div className="font-semibold text-green-400">{otherProfile.alias}</div>
                  <div className="text-sm opacity-80">{c.lastMessage ?? "Nuevo chat"}</div>
                  <div className="text-xs opacity-70">{new Date(c.updatedAt?.seconds*1000||Date.now()).toLocaleString()}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
