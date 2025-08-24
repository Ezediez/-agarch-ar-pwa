import React from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Input } from '@/components/ui/input';
    import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
    import { Search, MessageCircle } from 'lucide-react';

    const ConversationItem = ({ convo, onSelect, isActive }) => (
      <motion.div 
        layout 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0 }} 
        className={`flex items-center p-4 hover:bg-surface/80 cursor-pointer transition-colors border-b border-border-color ${isActive ? 'bg-primary/10' : ''}`} 
        onClick={onSelect}
      >
        <Avatar>
          <AvatarImage src={convo.profile_picture_url} alt={convo.alias}/>
          <AvatarFallback>{convo.alias?.[0]}</AvatarFallback>
        </Avatar>
        <div className="ml-4 flex-grow">
          <h4 className="font-semibold">{convo.alias}</h4>
        </div>
      </motion.div>
    );

    const ConversationList = ({ matches, activeChat, handleSelectChat }) => (
      <motion.div layout initial={{ x: -300 }} animate={{ x: 0 }} className={`w-full md:w-1/3 card-glass flex-col ${activeChat && 'hidden md:flex'}`}>
        <div className="p-4 border-b border-border-color">
          <h2 className="text-2xl font-bold text-primary">Chats</h2>
          <div className="relative mt-4">
            <Input placeholder="Buscar chats..." className="input-glass pl-10" />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          </div>
        </div>
        <div className="flex-grow overflow-y-auto scrollbar-hide">
          <AnimatePresence>
            {matches.length > 0 ? matches.map(match => (
              <ConversationItem key={match.id} convo={match} onSelect={() => handleSelectChat(match)} isActive={activeChat?.id === match.id} />
            )) : (
              <div className="text-center p-8 text-text-secondary">
                <MessageCircle className="w-12 h-12 mx-auto mb-2" />
                <p>No tienes matches aún.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );

    export default ConversationList;