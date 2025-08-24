import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast.jsx';
import { Send, ArrowLeft, MessageCircle, Loader2, Image, Video, PlusCircle, Mic, Camera, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import MessageBubble from './MessageBubble';
import AudioRecorder from './AudioRecorder';
import { Progress } from "@/components/ui/progress";
import ImageUploader from '@/components/ImageUploader';
import VideoUploader from '@/components/VideoUploader';

const StagedFilePreview = ({ file, onRemove }) => {
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            setPreview('video');
        }
    }, [file]);

    return (
        <div className="relative w-20 h-20 rounded-md overflow-hidden">
            {preview === 'video' ? (
                <div className="w-full h-full bg-black flex items-center justify-center">
                    <Video className="w-8 h-8 text-white" />
                </div>
            ) : (
                preview && <img src={preview} alt={file.name} className="w-full h-full object-cover" />
            )}
            <Button size="icon" variant="destructive" className="absolute top-1 right-1 h-6 w-6" onClick={onRemove}>
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
};


const ChatWindow = ({
    activeChat,
    setActiveChat,
    loadingMessages,
    messages,
    messagesEndRef,
    profile,
    handleAudioUpload,
    handleFilesUpload,
    isUploading,
    uploadProgress,
    sendMessage
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [stagedFiles, setStagedFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);


   useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = `${Math.min(scrollHeight, 128)}px`;
    }
}, [newMessage]);


  const handleSendMessage = async () => {
    if ((!newMessage.trim() && stagedFiles.length === 0) || isUploading) return;
    if (!activeChat || !user || !profile) return;

    if (!profile.is_vip && newMessage.length > 100) {
        toast({variant: "destructive", title: "Límite alcanzado", description: "Los usuarios básicos solo pueden enviar mensajes de hasta 100 caracteres."});
        return;
    }
    
    if (stagedFiles.length > 0) {
        await handleFilesUpload(stagedFiles, newMessage);
    } else {
        await sendMessage({
          match_id: activeChat.match_id,
          sender_id: user.id,
          content: newMessage,
          message_type: 'text',
        });
    }

    setNewMessage('');
    setStagedFiles([]);
  };

  const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
      }
  };

  const checkMediaLimits = (files) => {
    if (profile?.is_vip) return true;

    const newImageCount = files.filter(f => f.type.startsWith('image/')).length;
    const newVideoCount = files.filter(f => f.type.startsWith('video/')).length;
    const stagedImageCount = stagedFiles.filter(f => f.type.startsWith('image/')).length;
    const stagedVideoCount = stagedFiles.filter(f => f.type.startsWith('video/')).length;

    if (stagedImageCount + newImageCount > 2) {
        toast({ variant: "destructive", title: "Límite de fotos alcanzado", description: "Los usuarios básicos solo pueden adjuntar 2 fotos por mensaje." });
        return false;
    }
    if (stagedVideoCount + newVideoCount > 1) {
        toast({ variant: "destructive", title: "Límite de videos alcanzado", description: "Los usuarios básicos solo pueden adjuntar 1 video por mensaje." });
        return false;
    }
    return true;
  };

  const handleFileSelection = (event) => {
    const files = Array.from(event.target.files);
    if (checkMediaLimits(files)) {
        setStagedFiles(prev => [...prev, ...files]);
    }
    event.target.value = null;
  };

  const handleCameraUpload = (file) => {
    if (checkMediaLimits([file])) {
      setStagedFiles(prev => [...prev, file]);
    }
  }

  const handleFileSelect = (type) => {
    if (fileInputRef.current) {
        fileInputRef.current.accept = type === 'image' ? 'image/*' : 'video/*';
        fileInputRef.current.multiple = true;
        fileInputRef.current.click();
    }
  };

  const removeStagedFile = (index) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== index));
  };


  return (
    <motion.div layout initial={{ x: 300 }} animate={{ x: 0 }} className={`w-full md:w-2/3 card-glass flex flex-col ${!activeChat && 'hidden md:flex'}`}>
        <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelection} />
        
        {activeChat ? (
            <>
            <div className="p-4 border-b border-border-color flex items-center space-x-4 shrink-0">
                <Button variant="ghost" className="md:hidden" onClick={() => setActiveChat(null)}><ArrowLeft/></Button>
                <Avatar><AvatarImage src={activeChat.profile_picture_url} alt={activeChat.alias}/><AvatarFallback>{activeChat.alias?.[0]}</AvatarFallback></Avatar>
                <div><h3 className="text-xl font-bold">{activeChat.alias}</h3></div>
            </div>
            <div className="flex-grow p-4 overflow-y-auto scrollbar-hide flex flex-col-reverse">
                {loadingMessages ?
                    <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    : (
                    <div className="space-y-4">
                        <AnimatePresence>{messages.map(msg => (<MessageBubble key={msg.id} message={msg} currentUser={user} />))}</AnimatePresence>
                         <div ref={messagesEndRef} />
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-border-color shrink-0">
                
                {isRecording ? (
                    <AudioRecorder onRecordingComplete={handleAudioUpload} profile={profile} isRecording={isRecording} setIsRecording={setIsRecording} />
                ) : (
                    <>
                         {isUploading && (
                            <div className="mb-2">
                              <p className="text-sm text-text-secondary mb-1">Subiendo archivos... {Math.round(uploadProgress)}%</p>
                              <Progress value={uploadProgress} className="w-full h-2" />
                            </div>
                          )}
                        {stagedFiles.length > 0 && !isUploading && (
                            <div className="mb-2 p-2 bg-surface/50 rounded-lg">
                                <div className="flex flex-wrap gap-2">
                                    {stagedFiles.map((file, index) => (
                                        <StagedFilePreview key={index} file={file} onRemove={() => removeStagedFile(index)} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex items-end space-x-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button type="button" variant="ghost" className="btn-action self-end !p-2 !h-10 !w-10" disabled={isUploading}><PlusCircle size={24}/></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="card-glass mb-2">
                                    <DropdownMenuItem onClick={() => handleFileSelect('image')}><Image className="mr-2 h-4 w-4"/>Subir Foto</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleFileSelect('video')}><Video className="mr-2 h-4 w-4"/>Subir Video</DropdownMenuItem>
                                    <ImageUploader useCamera onUploadSuccess={handleCameraUpload} uploading={isUploading}>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}><Camera className="mr-2 h-4 w-4"/>Tomar Foto</DropdownMenuItem>
                                    </ImageUploader>
                                    <VideoUploader useCamera onUploadSuccess={handleCameraUpload} uploading={isUploading}>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}><Camera className="mr-2 h-4 w-4"/>Grabar Video</DropdownMenuItem>
                                    </VideoUploader>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <div className="relative flex-grow">
                                <Textarea
                                    ref={textareaRef}
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Escribe un mensaje..."
                                    className="input-glass pr-10 resize-none overflow-y-auto"
                                    rows="1"
                                    maxLength={!profile?.is_vip ? 100 : undefined}
                                    disabled={isUploading}
                                />
                                {!profile?.is_vip && <div className="absolute right-3 bottom-2 text-xs text-text-secondary">{100 - newMessage.length}</div>}
                            </div>
                            {(newMessage.trim() || stagedFiles.length > 0) ? (
                                <Button type="button" onClick={handleSendMessage} variant="ghost" className="btn-action self-end !p-2 !h-10 !w-10" disabled={isUploading}>
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send size={24} />}
                                </Button>
                            ) : (
                                <Button type="button" variant="ghost" className="btn-action self-end !p-2 !h-10 !w-10" onClick={() => setIsRecording(true)} disabled={isUploading}>
                                    <Mic size={24} />
                                </Button>
                            )}
                        </div>
                    </>
                )}
            </div>
            </>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary text-center p-4">
                <MessageCircle className="w-24 h-24 mb-4" />
                <h2 className="text-2xl font-bold">Selecciona un chat</h2>
                <p>Elige una conversación para empezar a chatear.</p>
            </div>
        )}
    </motion.div>
  );
}

export default ChatWindow;