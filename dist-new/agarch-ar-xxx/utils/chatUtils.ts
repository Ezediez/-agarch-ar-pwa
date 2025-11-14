import { addDoc, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";

export async function startConversation(otherUid: string, navigate: ReturnType<typeof useNavigate>) {
  const uid = auth.currentUser?.uid!;
  const conv = {
    members: [uid, otherUid],
    lastMessage: "",
    lastSenderId: uid,
    updatedAt: new Date().toISOString(),
  };
  const ref = await addDoc(collection(db, "conversations"), conv);
  navigate(`/chat/${ref.id}`);
}
