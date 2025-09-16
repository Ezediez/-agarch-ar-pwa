import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import {
  collection, query, where, orderBy, onSnapshot
} from "firebase/firestore";

export default function ChatsPage() {
  const [items, setItems] = useState<any[]>([]);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "conversations"),
      where("members", "array-contains", uid),
      orderBy("updatedAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
        {items.map(c => (
          <Link key={c.id}
            to={`/chat/${c.id}`}
            className="block rounded-xl bg-slate-800 hover:bg-slate-700 p-4 text-white">
            <div className="font-semibold">{c.lastMessage ?? "Nuevo chat"}</div>
            <div className="text-xs opacity-70">{new Date(c.updatedAt?.seconds*1000||Date.now()).toLocaleString()}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
