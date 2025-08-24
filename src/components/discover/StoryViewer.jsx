import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Pause, Play, Trash2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast.jsx';
import { useNavigate } from 'react-router-dom';

const StoryViewer = ({ storyGroup, onClose }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);
  const progressRef = useRef(null);

  const currentStory = storyGroup.stories[currentIndex];
  const isOwnStory = user?.id === storyGroup.user_id;

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (progressRef.current) cancelAnimationFrame(progressRef.current);

    const duration = 5000; // 5 seconds per story
    let startTime = performance.now();

    const animateProgress = (timestamp) => {
      const elapsed = timestamp - startTime;
      const newProgress = (elapsed / duration) * 100;
      setProgress(newProgress);

      if (newProgress < 100) {
        progressRef.current = requestAnimationFrame(animateProgress);
      }
    };
    progressRef.current = requestAnimationFrame(animateProgress);

    timerRef.current = setTimeout(() => {
      goToNextStory();
    }, duration);
  };

  useEffect(() => {
    if (!isPaused) {
      startTimer();
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) cancelAnimationFrame(progressRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) cancelAnimationFrame(progressRef.current);
    };
  }, [currentIndex, isPaused]);

  const goToNextStory = () => {
    if (currentIndex < storyGroup.stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const goToPrevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const togglePause = () => setIsPaused(prev => !prev);

  const handleDeleteStory = async () => {
    if (!isOwnStory) return;
    const { error } = await supabase.from('stories').delete().eq('id', currentStory.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la historia.' });
    } else {
      toast({ title: 'Historia eliminada' });
      onClose(); // Or navigate to next/prev
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="relative w-full max-w-md h-full max-h-[90vh] bg-black rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 p-4 z-10">
          <div className="flex items-center gap-2 mb-2">
            {storyGroup.stories.map((_, index) => (
              <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                {index < currentIndex && <div className="h-full w-full bg-white" />}
                {index === currentIndex && <Progress value={progress} className="h-1 [&>div]:bg-white" />}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate(`/profile/${storyGroup.user_id}`)}>
              <Avatar>
                <AvatarImage src={storyGroup.profile_picture_url} alt={storyGroup.alias} />
                <AvatarFallback>{storyGroup.alias?.[0]}</AvatarFallback>
              </Avatar>
              <span className="font-bold">{storyGroup.alias}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={togglePause}>{isPaused ? <Play /> : <Pause />}</button>
              {isOwnStory && <button onClick={handleDeleteStory}><Trash2 /></button>}
              <button onClick={onClose}><X /></button>
            </div>
          </div>
        </div>

        {currentStory.media_type === 'image' ? (
          <img src={currentStory.media_url} alt="Story content" className="w-full h-full object-contain" />
        ) : (
          <video src={currentStory.media_url} autoPlay muted className="w-full h-full object-contain" />
        )}

        <button onClick={goToPrevStory} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 p-2 rounded-full text-white">
          <ChevronLeft />
        </button>
        <button onClick={goToNextStory} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 p-2 rounded-full text-white">
          <ChevronRight />
        </button>
      </div>
    </motion.div>
  );
};

export default StoryViewer;