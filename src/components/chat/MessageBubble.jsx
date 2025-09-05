import React from 'react';
    import { motion } from 'framer-motion';
    import { format } from 'date-fns';
    import { es } from 'date-fns/locale';
    import { Loader2, Image, Video } from 'lucide-react';

    const MessageBubble = ({ message, currentUser }) => {
      const isSender = message.sender_id === currentUser.id;
      const bubbleClass = isSender ? 'bg-primary text-background rounded-br-none' : 'bg-surface text-text-primary rounded-bl-none';

      const formatTime = (timestamp) => {
        if (!timestamp || message.id.toString().startsWith('temp-')) {
            return 'Enviando...';
        }
        
        let date;
        if (timestamp.endsWith('Z') || timestamp.includes('+')) {
            date = new Date(timestamp);
        } else {
            date = new Date(timestamp + 'Z');
        }
        
        return format(date, 'p', { locale: es });
      };

      const renderMedia = (url) => {
        if (!url) return null;
        if (url.startsWith('blob:')) {
           if(message.media_urls[0].type && message.media_urls[0].type.startsWith('video/')) {
              return <video src={url} controls className="rounded-lg max-w-full h-auto" />;
           }
           return <img src={url} alt="Imagen adjunta" className="rounded-lg max-w-full h-auto" />;
        }
        
        const extension = url.split('.').pop().toLowerCase().split('?')[0];
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
            return <img src={url} alt="Imagen adjunta" className="rounded-lg max-w-full h-auto" />;
        }
        if (['mp4', 'webm', 'mov', 'm4v'].includes(extension)) {
            return <video src={url} controls className="rounded-lg max-w-full h-auto" />;
        }
        return null;
      };

      return (
        <motion.div layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${bubbleClass} shadow-md`}>
            
            {message.isOptimistic && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
            )}

            {message.media_urls && message.media_urls.length > 0 && (
                <div className="grid gap-2" style={{gridTemplateColumns: `repeat(${Math.min(message.media_urls.length, 2)}, 1fr)`}}>
                    {message.media_urls.map((url, index) => (
                        <div key={index} className="rounded-lg overflow-hidden relative">
                            {renderMedia(url)}
                            {message.id.toString().startsWith('temp-') && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {message.contenido && <p className="whitespace-pre-wrap break-words mt-2">{message.contenido}</p>}
            
            {message.message_type === 'audio' && message.media_urls?.[0] && 
                <div className="flex items-center">
                    <audio src={message.media_urls[0]} controls className="w-full" />
                </div>
            }
            {message.message_type === 'audio' && !message.media_urls && <div className="flex items-center space-x-2"><Loader2 className="w-4 h-4 animate-spin" /> <p>Subiendo audio...</p></div>}
            
            <p className="text-xs opacity-70 mt-1 text-right">{formatTime(message.sent_at)}</p>
          </div>
        </motion.div>
      );
    };

    export default MessageBubble;