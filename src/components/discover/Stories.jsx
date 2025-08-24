import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import StoryViewer from '@/components/discover/StoryViewer';
import { useToast } from '@/components/ui/use-toast.jsx';

const StoryBubble = ({ storyGroup, onSelect }) => {
  const hasViewed = false;
  const ringClass = hasViewed ? 'ring-gray-400' : 'ring-primary';

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center space-y-2 cursor-pointer"
      onClick={onSelect}
    >
      <div className={`relative w-16 h-16 rounded-full ring-2 ${ringClass} ring-offset-2 ring-offset-background p-1`}>
        <Avatar className="w-full h-full">
          <AvatarImage src={storyGroup.profile_picture_url} alt={storyGroup.alias} />
          <AvatarFallback>{storyGroup.alias?.[0]}</AvatarFallback>
        </Avatar>
      </div>
      <p className="text-xs text-text-secondary truncate w-16 text-center">{storyGroup.alias}</p>
    </motion.div>
  );
};

const Stories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStoryUser, setSelectedStoryUser] = useState(null);

  const fetchStories = useCallback(async () => {
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
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar las historias.' });
      console.error('Error fetching stories:', error);
    } else if (data) {
      const groupedStories = (data || []).reduce((acc, story) => {
        if (story.profile) {
          if (!acc[story.user_id]) {
            acc[story.user_id] = {
              user_id: story.user_id,
              alias: story.profile.alias,
              profile_picture_url: story.profile.profile_picture_url,
              stories: []
            };
          }
          acc[story.user_id].stories.push(story);
        }
        return acc;
      }, {});
      
      const ownStories = groupedStories[user.id];
      delete groupedStories[user.id];
      
      const otherStories = Object.values(groupedStories);
      
      const finalStories = ownStories ? [ownStories, ...otherStories] : otherStories;

      setStories(finalStories);
    }
    setLoading(false);
  }, [toast, user.id]);

  useEffect(() => {
    fetchStories();
    const channel = supabase
      .channel('public:stories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stories' }, fetchStories)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
      <div className="card-glass p-4">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
          {stories.map(storyGroup => (
            <StoryBubble key={storyGroup.user_id} storyGroup={storyGroup} onSelect={() => setSelectedStoryUser(storyGroup)} />
          ))}
        </div>
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