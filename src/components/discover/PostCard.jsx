import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, MoreHorizontal, UserCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast.jsx';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient'; // 🔥 Firebase client
import { useAuth } from '@/hooks/useAuth';
import CommentModal from './CommentModal';

const PostCard = ({ post, onLikeToggle }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    
    // Hooks must be called at the top level, before any early returns.
    const [optimisticLiked, setOptimisticLiked] = useState(post?.is_liked);
    const [optimisticLikesCount, setOptimisticLikesCount] = useState(post?.likes_count);

    if (!post || !post.author) {
        return null; 
    }

    const { author, text, image_url, video_url, created_at, likes_count, comments_count, id } = post;

    const handleProfileClick = () => {
        if (author && author.id) {
            navigate(`/profile/${author.id}`);
        }
    };
    
    const handleLikeClick = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Debes iniciar sesión para dar me gusta.' });
            return;
        }

        const currentlyLiked = optimisticLiked;
        setOptimisticLiked(!currentlyLiked);
        setOptimisticLikesCount(prev => currentlyLiked ? prev - 1 : prev + 1);

        onLikeToggle(id, !currentlyLiked, currentlyLiked ? likes_count - 1 : likes_count + 1);

        if (currentlyLiked) {
            const { error } = await supabase.from('post_likes').delete().match({ post_id: id, user_id: user.id });
            if (error) {
                setOptimisticLiked(true);
                setOptimisticLikesCount(prev => prev + 1);
                onLikeToggle(id, true, likes_count);
                toast({ variant: 'destructive', title: 'Error al quitar el Me Gusta' });
            }
        } else {
            const { error } = await supabase.from('post_likes').insert({ post_id: id, user_id: user.id });
            if (error) {
                setOptimisticLiked(false);
                setOptimisticLikesCount(prev => prev - 1);
                onLikeToggle(id, false, likes_count);
                toast({ variant: 'destructive', title: 'Error al dar Me Gusta' });
            }
        }
    };

    return (
        <>
            <motion.div 
                layout
                className="card-glass p-4 rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={handleProfileClick}>
                        <Avatar>
                            <AvatarImage src={author.profile_picture_url || ''} alt={author.alias} />
                            <AvatarFallback>
                                {author.alias ? author.alias.charAt(0).toUpperCase() : <UserCircle />}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-text-primary">{author.alias || 'Usuario Anónimo'}</p>
                            <p className="text-xs text-text-secondary">
                                {formatDistanceToNow(new Date(created_at), { addSuffix: true, locale: es })}
                            </p>
                        </div>
                    </div>
                    <button className="text-text-secondary hover:text-primary"><MoreHorizontal /></button>
                </div>
                
                {text && <p className="text-text-primary mb-3 whitespace-pre-wrap break-words">{text}</p>}
                
                {image_url && (
                    <div className="mb-3 rounded-lg overflow-hidden cursor-pointer">
                        <img src={image_url} alt="Contenido de la publicación" className="rounded-md object-cover w-full" />
                    </div>
                )}

                {video_url && (
                    <div className="mb-3 rounded-lg overflow-hidden">
                        <video src={video_url} controls className="w-full rounded-md" />
                    </div>
                )}

                <div className="flex items-center justify-between text-text-secondary pt-2 border-t border-border-color">
                    <div className="flex items-center gap-4">
                        <button 
                            className={`flex items-center gap-1.5 hover:text-secondary transition-colors ${optimisticLiked ? 'text-secondary' : ''}`} 
                            onClick={handleLikeClick}
                        >
                            <Heart className={`w-5 h-5 ${optimisticLiked ? 'fill-current' : ''}`} />
                            <span className="text-sm">{optimisticLikesCount}</span>
                        </button>
                        <button 
                            className="flex items-center gap-1.5 hover:text-primary transition-colors" 
                            onClick={() => setIsCommentModalOpen(true)}
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm">{comments_count}</span>
                        </button>
                    </div>
                </div>
            </motion.div>
            {isCommentModalOpen && (
                <CommentModal
                    postId={id}
                    commentsCount={comments_count}
                    onClose={() => setIsCommentModalOpen(false)}
                />
            )}
        </>
    );
};

export default PostCard;