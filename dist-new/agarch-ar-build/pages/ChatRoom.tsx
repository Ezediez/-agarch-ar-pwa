import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { auth, db, storage } from "@/lib/firebase";
import {
  addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, updateDoc, limit as limitQuery
} from "firebase/firestore";
import { LIMITS } from "@/features/chat/limits";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { useMediaPermissions } from "@/hooks/useMediaPermissions";
import MediaPermissionPrompt from "@/components/MediaPermissionPrompt";
import CameraGalleryModal from "@/components/CameraGalleryModal";

type MediaItem = { type: "image"|"video"|"audio"; url: string; durationSec?: number; };
const MESSAGE_LIMIT = 120;

export default function ChatRoom() {
  const { id: conversationId } = useParams();
  const uid = auth.currentUser?.uid!;
  const [tier, setTier] = useState<"basic"|"vip">("basic"); // Cárgalo de /users/{uid}
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [permissionsChecked, setPermissionsChecked] = useState(false);
  const [profiles, setProfiles] = useState<{[key: string]: any}>({});
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [currentMediaType, setCurrentMediaType] = useState<'image' | 'video'>('image');
  const [expandedMedia, setExpandedMedia] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioStreamRef = useRef<MediaStream|null>(null);
  const mediaRecorderRef = useRef<MediaRecorder|null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const limits = useMemo(()=>LIMITS[tier], [tier]);
  const { permissions, requestCameraPermission, requestMicrophonePermission } = useMediaPermissions();

  // Limpiar intervalos al desmontar
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

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

  // Verificar permisos al cargar (solo la primera vez)
  useEffect(() => {
    if (!permissionsChecked) {
      // Verificar si ya se mostró el modal antes
      const permissionModalShown = localStorage.getItem('agarch-permission-modal-shown');
      
      if (!permissionModalShown) {
        const hasCamera = permissions.camera === 'granted';
        const hasMicrophone = permissions.microphone === 'granted';
        
        if (!hasCamera || !hasMicrophone) {
          setShowPermissionPrompt(true);
        }
      }
      setPermissionsChecked(true);
    }
  }, [permissions, permissionsChecked]);

  // Cargar información de la conversación y el otro usuario
  useEffect(() => {
    if (!conversationId || !uid) return;
    
    const loadConversationInfo = async () => {
      try {
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationSnap = await getDoc(conversationRef);
        
        if (conversationSnap.exists()) {
          const conversationData = conversationSnap.data();
          const members = conversationData.members || [];
          
          // Encontrar el otro usuario (no el actual)
          const otherUserId = members.find((id: string) => id !== uid);
          if (otherUserId) {
            const otherProfile = await loadProfile(otherUserId);
            setOtherUserProfile(otherProfile);
          }
        }
      } catch (error) {
        console.error('Error loading conversation info:', error);
      }
    };
    
    loadConversationInfo();
  }, [conversationId, uid]);

  // Suscribirse a mensajes
  useEffect(() => {
    if (!conversationId) return;
    const q = query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("createdAt", "desc"),
      limitQuery(MESSAGE_LIMIT)
    );
    return onSnapshot(q, async (snap) => {
      const performanceLabel = `chat-messages-${conversationId}-${Date.now()}`;
      if (import.meta.env.DEV) {
        console.time(performanceLabel);
      }
      const newMessages = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .reverse()
        .map((message) => ({
          ...message,
          createdAt:
            message.createdAt instanceof Date
              ? message.createdAt.toISOString()
              : typeof message.createdAt === "string"
              ? message.createdAt
              : message.createdAt?.seconds
              ? new Date(message.createdAt.seconds * 1000).toISOString()
              : new Date().toISOString(),
        }));
      
      // Cargar perfiles de usuarios únicos en los mensajes
      const uniqueUserIds = [...new Set(newMessages.map(m => m.authorId))];
      for (const userId of uniqueUserIds) {
        await loadProfile(userId);
      }
      
      setMessages(newMessages);
      if (import.meta.env.DEV) {
        console.timeEnd(performanceLabel);
      }
    });
  }, [conversationId]);

  // Util: subir archivo a Storage y devolver URL
  async function uploadFile(file: File, kind: "image"|"video"|"audio") {
    const path = `uploads/${uid}/${conversationId}/${Date.now()}_${file.name}`;
    const r = ref(storage, path);
    await new Promise<void>((res, rej) => {
      const task = uploadBytesResumable(r, file);
      task.on("state_changed", undefined, rej, () => res());
    });
    const url = await getDownloadURL(r);
    return { type: kind, url } as MediaItem;
  }

  // Texto
  async function sendText() {
    const trimmed = text.trim();
    
    // Si está grabando, detener grabación primero
    if (isRecording) {
      stopRecording();
      return;
    }
    
    // Si no hay texto, no enviar
    if (!trimmed) return;
    if (trimmed.length > limits.maxTextLen) {
      alert(`Máximo ${limits.maxTextLen} caracteres para tu plan.`);
      return;
    }
    setSending(true);
    const msg = {
      authorId: uid,
      type: "text",
      text: trimmed,
      media: [],
      createdAt: new Date().toISOString(),
    };
    await addDoc(collection(db, "conversations", conversationId!, "messages"), msg);
    
    // Obtener alias del usuario actual para el lastMessage
    const currentUserProfile = await loadProfile(uid);
    await updateDoc(doc(db, "conversations", conversationId!), {
      lastMessage: `${currentUserProfile.alias}: ${trimmed.slice(0, 80)}`,
      lastSenderId: uid,
      updatedAt: new Date().toISOString(),
    });
    setText("");
    setSending(false);
  }

  // Imágenes desde galería / cámara
  async function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const max = limits.maxPhotos;
    if (files.length > max) return alert(`Máximo ${max} foto(s) por mensaje en tu plan.`);
    setSending(true);
    const medias: MediaItem[] = [];
    for (const f of files.slice(0, max)) {
      medias.push(await uploadFile(f, "image"));
    }
    await addDoc(collection(db, "conversations", conversationId!, "messages"), {
      authorId: uid, type: "media", text: "", media: medias, createdAt: new Date().toISOString(),
    });
    
    // Obtener alias del usuario actual para el lastMessage
    const currentUserProfile = await loadProfile(uid);
    await updateDoc(doc(db, "conversations", conversationId!), {
      lastMessage: `${currentUserProfile.alias}: 📷 Foto`,
      lastSenderId: uid, updatedAt: new Date().toISOString(),
    });
    e.target.value = "";
    setSending(false);
  }

  // Video "shoot" (15s) desde cámara o galería (acepta solo 15s si graba)
  async function onPickVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const max = limits.maxVideos;
    if (files.length > max) return alert(`Máximo ${max} video(s) por mensaje en tu plan.`);
    setSending(true);
    const medias: MediaItem[] = [];
    for (const f of files.slice(0, max)) {
      medias.push(await uploadFile(f, "video"));
    }
    await addDoc(collection(db, "conversations", conversationId!, "messages"), {
      authorId: uid, type: "media", text: "", media: medias, createdAt: new Date().toISOString(),
    });
    
    // Obtener alias del usuario actual para el lastMessage
    const currentUserProfile = await loadProfile(uid);
    await updateDoc(doc(db, "conversations", conversationId!), {
      lastMessage: `${currentUserProfile.alias}: 🎬 Video`,
      lastSenderId: uid, updatedAt: new Date().toISOString(),
    });
    e.target.value = "";
    setSending(false);
  }

  // Audio grabado (MediaRecorder) con límite por plan
  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert("Tu navegador no soporta grabación.");
      return;
    }
    
    if (permissions.microphone !== 'granted') {
      const granted = await requestMicrophonePermission();
      if (!granted) {
        alert("Se necesita permiso del micrófono para grabar audio.");
        return;
      }
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const rec = new MediaRecorder(stream);
      mediaRecorderRef.current = rec;
      audioChunksRef.current = [];
      rec.ondataavailable = (ev) => audioChunksRef.current.push(ev.data);
      rec.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const dur = Math.round((await blob.arrayBuffer()).byteLength / (16_000 * 2)); // aprox
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: "audio/webm" });
        const media = await uploadFile(file, "audio");
        await addDoc(collection(db, "conversations", conversationId!, "messages"), {
          authorId: uid, type: "media", text: "", media: [{...media, durationSec: dur}], createdAt: new Date().toISOString(),
        });
        
        // Obtener alias del usuario actual para el lastMessage
        const currentUserProfile = await loadProfile(uid);
        await updateDoc(doc(db, "conversations", conversationId!), {
          lastMessage: `${currentUserProfile.alias}: 🎤 Audio`,
          lastSenderId: uid, updatedAt: new Date().toISOString(),
        });
      };
      rec.start();
      
      // Iniciar contador
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-detener al llegar al límite
          if (newTime >= limits.maxAudioSec) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert("Error al acceder al micrófono. Verifica los permisos.");
    }
  }
  function stopRecording() {
    mediaRecorderRef.current?.stop();
    audioStreamRef.current?.getTracks().forEach(t => t.stop());
    
    // Detener contador
    setIsRecording(false);
    setRecordingTime(0);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }

  return (
    <div className="flex flex-col h-[100svh] bg-slate-900 text-white max-w-full overflow-x-hidden chat-container">
      {/* Header con nombre del otro usuario */}
      {otherUserProfile && (
        <div className="bg-slate-800 p-3 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <img 
              src={otherUserProfile.profile_picture_url} 
              alt={otherUserProfile.alias}
              className="w-10 h-10 rounded-full object-cover"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.src = '/pwa-512x512.png';
              }}
            />
            <div>
              <div className="font-semibold text-green-400">{otherUserProfile.alias}</div>
              <div className="text-xs opacity-70">{otherUserProfile.ubicacion || 'Ubicación no especificada'}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-w-full">
        {messages.map(m => {
          const authorProfile = profiles[m.authorId] || { alias: 'Usuario', profile_picture_url: '/pwa-512x512.png' };
          const isCurrentUser = m.authorId === uid;
          
          return (
            <div key={m.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
              {!isCurrentUser && (
                <img 
                  src={authorProfile.profile_picture_url} 
                  alt={authorProfile.alias}
                  className="w-8 h-8 rounded-full object-cover mr-2 mt-1"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.src = '/pwa-512x512.png';
                  }}
                />
              )}
              <div className={`max-w-[80%] rounded-2xl p-3 ${isCurrentUser ? 'bg-green-600' : 'bg-slate-800'}`}>
                {!isCurrentUser && (
                  <div className="text-xs font-semibold text-green-400 mb-1">{authorProfile.alias}</div>
                )}
                {m.text && <div className="whitespace-pre-wrap">{m.text}</div>}
                
                {/* Timestamp del mensaje */}
                <div className="text-xs opacity-70 mt-1 text-right">
                  {new Date(m.createdAt).toLocaleString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </div>
                {Array.isArray(m.media) && m.media.map((mi: any, i: number) => {
                  const mediaId = `${m.id}-${i}`;
                  const isExpanded = expandedMedia === mediaId;
                  
                  return (
                    <div key={i} className="mt-2">
                      {mi.type === "image" && (
                        <img 
                          src={mi.url} 
                          className={`rounded-xl cursor-pointer transition-all duration-300 ${
                            isExpanded 
                              ? 'max-h-96 w-full object-contain' 
                              : 'max-h-32 max-w-48 object-cover'
                          }`}
                          loading="lazy"
                          decoding="async"
                          onClick={() => setExpandedMedia(isExpanded ? null : mediaId)}
                        />
                      )}
                      {mi.type === "video" && (
                        <video 
                          controls 
                          src={mi.url} 
                          className={`rounded-xl cursor-pointer transition-all duration-300 ${
                            isExpanded 
                              ? 'max-h-96 w-full' 
                              : 'max-h-32 max-w-48'
                          }`}
                          preload="metadata"
                          playsInline
                          onClick={() => setExpandedMedia(isExpanded ? null : mediaId)}
                        />
                      )}
                      {mi.type === "audio" && <audio controls src={mi.url} />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Barra de entrada */}
      <div className="p-2 border-t border-slate-800 max-w-full">
        <div className="flex items-center gap-1 max-w-full chat-input">
          {/* Adjuntar fotos */}
          <button onClick={() => {
                  setCurrentMediaType('image');
                  setShowCameraModal(true);
                }}
                  className="px-2 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 flex-shrink-0">📷</button>
          <input ref={mediaInputRef}
                 type="file" accept="image/*" multiple
                 className="hidden" onChange={onPickImages} />

          {/* Adjuntar video */}
          <button onClick={() => {
                  setCurrentMediaType('video');
                  setShowCameraModal(true);
                }}
                  className="px-2 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 flex-shrink-0">🎬</button>
          <input ref={videoInputRef}
                 type="file" accept="video/*"
                 className="hidden" onChange={onPickVideo} />

          {/* Campo de texto */}
          <input
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, limits.maxTextLen))}
            placeholder={`Escribe un mensaje… (${limits.maxTextLen})`}
            className="flex-1 rounded-xl bg-slate-800 px-3 py-2 text-white placeholder-gray-400 border border-slate-600 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 min-w-0"
            autoComplete="off"
            spellCheck="false"
            style={{ 
              fontSize: '16px',
              color: '#ffffff',
              backgroundColor: '#1e293b',
              border: '1px solid #475569'
            }}
          />

          {/* Audio */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isRecording ? (
              <button onMouseDown={startRecording}
                      className="px-2 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white border border-red-600 flex-shrink-0">
                🎤
              </button>
            ) : (
              <>
                <button onClick={stopRecording}
                        className="px-2 py-2 rounded-xl bg-red-600 border border-red-500 text-white flex-shrink-0 animate-pulse">
                  ⏹️ STOP
                </button>
                <div className="text-red-400 text-sm font-mono">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </div>
              </>
            )}
          </div>

          {/* Enviar */}
          <button disabled={sending || (!text.trim() && !isRecording)} onClick={sendText}
                  className={`px-3 py-2 rounded-xl text-white border flex-shrink-0 ${
                    (text.trim() || isRecording) 
                      ? 'bg-green-600 hover:bg-green-500 border-green-500' 
                      : 'bg-gray-600 border-gray-500 opacity-50'
                  }`}>
            {isRecording ? 'Enviar Audio' : 'Enviar'}
          </button>
        </div>
        <div className="text-xs opacity-70 mt-1">
          Plan: <b>{tier}</b> • Fotos: {LIMITS[tier].maxPhotos} • Videos: {LIMITS[tier].maxVideos} • Audio: {LIMITS[tier].maxAudioSec}s
        </div>
      </div>

      {/* Prompt de permisos */}
             {showPermissionPrompt && (
               <MediaPermissionPrompt
                 onPermissionsGranted={() => {
                   setShowPermissionPrompt(false);
                   localStorage.setItem('agarch-permission-modal-shown', 'true');
                 }}
                 onSkip={() => {
                   setShowPermissionPrompt(false);
                   localStorage.setItem('agarch-permission-modal-shown', 'true');
                 }}
               />
             )}
             
             {/* Modal Cámara/Galería */}
             <CameraGalleryModal
               isOpen={showCameraModal}
               onClose={() => setShowCameraModal(false)}
               onSelectCamera={() => {
                 if (currentMediaType === 'image') {
                   // Crear input temporal para cámara
                   const tempInput = document.createElement('input');
                   tempInput.type = 'file';
                   tempInput.accept = 'image/*';
                   tempInput.capture = 'environment';
                   tempInput.multiple = true;
                   tempInput.onchange = onPickImages;
                   tempInput.click();
                 } else {
                   // Crear input temporal para video cámara
                   const tempInput = document.createElement('input');
                   tempInput.type = 'file';
                   tempInput.accept = 'video/*';
                   tempInput.capture = 'environment';
                   tempInput.onchange = onPickVideo;
                   tempInput.click();
                 }
               }}
               onSelectGallery={() => {
                 if (currentMediaType === 'image') {
                   mediaInputRef.current?.click();
                 } else {
                   videoInputRef.current?.click();
                 }
               }}
               mediaType={currentMediaType}
             />
           </div>
         );
       }
