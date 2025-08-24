import React from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast.jsx';

const AdCard = ({ ad }) => {
    const { toast } = useToast();

    const handleAdClick = () => {
        toast({
            title: "🚧 Función en desarrollo",
            description: "Pronto podrás interactuar con los anuncios.",
        });
    };

    return (
        <motion.div
            className="relative aspect-video w-full rounded-lg overflow-hidden shadow-lg group flex flex-col justify-end card-glass cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleAdClick}
        >
            <div 
                className="absolute inset-0 w-full h-full bg-gradient-to-br from-purple-600 to-pink-500 p-4 flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: ad.content_html || ad.title }}
            />
        </motion.div>
    );
};

export default AdCard;