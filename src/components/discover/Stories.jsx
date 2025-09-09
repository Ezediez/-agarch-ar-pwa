import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { db, auth, storage } from '@/lib/firebase'; // 🔥 Firebase client
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import StoryViewer from '@/components/discover/StoryViewer';
import { useToast } from '@/components/ui/use-toast.jsx';

const StoryBubble = ({ storyGroup, onSelect, isVip = false }) => {
  const hasViewed = false;
  const ringClass = hasViewed ? 'ring-gray-400' : isVip ? 'ring-yellow-500' : 'ring-primary';
  const sizeClass = isVip ? 'w-20 h-20' : 'w-16 h-16';

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center space-y-2 cursor-pointer flex-shrink-0"
      onClick={onSelect}
    >
      <div className={`relative ${sizeClass} rounded-full ring-2 ${ringClass} ring-offset-2 ring-offset-background p-1`}>
        <Avatar className="w-full h-full">
          <AvatarImage src={storyGroup.profile_picture_url} alt={storyGroup.alias} />
          <AvatarFallback className={isVip ? 'text-lg' : ''}>{storyGroup.alias?.[0]}</AvatarFallback>
        </Avatar>
        {isVip && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">👑</span>
          </div>
        )}
      </div>
      <p className={`text-xs text-text-secondary truncate text-center ${isVip ? 'w-20 font-semibold' : 'w-16'}`}>
        {storyGroup.alias}
      </p>
    </motion.div>
  );
};

const Stories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoryUser, setSelectedStoryUser] = useState(null);
  const refreshDebounceRef = useRef(null);

  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profile:user_id (id, alias, profile_picture_url)
        `)
        .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        // Ignorar errores típicos de tabla inexistente o RLS y evitar spam de toasts
        const msg = String(error.message || '');
        const code = error.code || '';
        const isIgnorable = code === '42P01' /* relation does not exist */ || code === '42501' /* insufficient_privilege */ || msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('does not exist');
        if (!isIgnorable) {
          console.error('Error fetching stories:', error);
          toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las historias.' });
        }
        setStories([]);
      } else if (data) {
        const groupedStories = (data || []).reduce((acc, story) => {
          if (story.profile) {
            if (!acc[story.user_id]) {
              acc[story.user_id] = {
                user_id: story.user_id,
                alias: story.profile.alias,
                profile_picture_url: story.profile.profile_picture_url,
                isVip: story.profile.membership_type === 'vip' || story.profile.is_verified,
                stories: []
              };
            }
            acc[story.user_id].stories.push(story);
          }
          return acc;
        }, {});
        
        // Separar por tipos
        const ownStories = groupedStories[user.id];
        delete groupedStories[user.id];
        
        const otherStories = Object.values(groupedStories);
        const vipStories = otherStories.filter(story => story.isVip);
        const regularStories = otherStories.filter(story => !story.isVip);
        
        // Orden final: Usuario propio → VIPs → Regulares
        const finalStories = [
          ...(ownStories ? [ownStories] : []),
          ...vipStories,
          ...regularStories
        ];
        
        setStories(finalStories);
      }
    } finally {
      setLoading(false);
    }
  }, [toast, user.id]);

  useEffect(() => {
    fetchStories();
    const channel = supabase
      .channel('public:stories')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories' }, () => {
        if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
        refreshDebounceRef.current = setTimeout(() => fetchStories(), 300);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'stories' }, () => {
        if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
        refreshDebounceRef.current = setTimeout(() => fetchStories(), 300);
      })
      .subscribe();

    return () => {
      if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
      db.removeChannel(channel);
    };
  }, [fetchStories]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-28 card-glass">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (stories.length === 0) {
    return null;
  }

  return (
    <>
      <div className="card-glass p-4 mb-4">
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
          {stories.map(storyGroup => (
            <StoryBubble 
              key={storyGroup.user_id} 
              storyGroup={storyGroup} 
              isVip={storyGroup.isVip}
              onSelect={() => setSelectedStoryUser(storyGroup)} 
            />
          ))}
        </div>
        
        {/* Indicador de scroll si hay muchas stories */}
        {stories.length > 4 && (
          <div className="flex justify-center mt-2">
            <div className="text-xs text-text-secondary opacity-75">
              ← Desliza para ver más →
            </div>
          </div>
        )}
      </div>

      {selectedStoryUser && (
        <StoryViewer
          storyGroup={selectedStoryUser}
          onClose={() => setSelectedStoryUser(null)}
        />
      )}
    </>
  );
};

export default Stories;
