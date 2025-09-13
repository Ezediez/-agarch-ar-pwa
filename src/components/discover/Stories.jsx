import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, where, getDocs, limit } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

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
      <span className="text-xs text-center max-w-16 truncate">{storyGroup.alias}</span>
    </motion.div>
  );
};

const Stories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoryUser, setSelectedStoryUser] = useState(null);

  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener historias de las últimas 24 horas
      const storiesRef = collection(db, 'stories');
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const storiesQuery = query(
        storiesRef,
        where('created_at', '>', yesterday),
        orderBy('created_at', 'desc'),
        limit(50)
      );
      
      const storiesSnapshot = await getDocs(storiesQuery);
      const storiesData = storiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Agrupar historias por usuario
      const groupedStories = {};
      storiesData.forEach(story => {
        if (!groupedStories[story.user_id]) {
          groupedStories[story.user_id] = {
            user_id: story.user_id,
            alias: story.alias || 'Usuario',
            profile_picture_url: story.profile_picture_url || null,
            isVip: story.isVip || false,
            stories: []
          };
        }
        groupedStories[story.user_id].stories.push(story);
      });

      setStories(Object.values(groupedStories));
    } catch (error) {
      console.error('Error fetching stories:', error);
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchStories();
    }
  }, [user, fetchStories]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Cargando historias...</span>
      </div>
    );
  }

  if (stories.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-2">
      <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
        {stories.map((storyGroup) => (
          <StoryBubble
            key={storyGroup.user_id}
            storyGroup={storyGroup}
            isVip={storyGroup.isVip}
            onSelect={() => setSelectedStoryUser(storyGroup)}
          />
        ))}
      </div>
    </div>
  );
};

export default Stories;