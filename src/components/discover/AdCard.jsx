import React from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast.jsx';
import { ExternalLink, Phone, Mail, Globe, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdCard = ({ ad, index = 0 }) => {
    const { toast } = useToast();

    const handleContactClick = (type, value) => {
        switch(type) {
            case 'phone':
                window.location.href = `tel:${value}`;
                break;
            case 'email':
                window.location.href = `mailto:${value}`;
                break;
            case 'website':
                window.open(value, '_blank');
                break;
            default:
                toast({
                    title: "Contactar Anunciante",
                    description: `${ad.company_name || ad.title}`,
                });
        }
    };

    // Diferentes estilos de banner para variedad
    const bannerStyles = [
        'bg-gradient-to-r from-blue-600 to-purple-600',
        'bg-gradient-to-r from-green-500 to-teal-600', 
        'bg-gradient-to-r from-orange-500 to-red-600',
        'bg-gradient-to-r from-purple-600 to-pink-600',
        'bg-gradient-to-r from-indigo-600 to-blue-600'
    ];
    
    const currentStyle = bannerStyles[index % bannerStyles.length];

    return (
        <motion.div
            className="w-full mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
        >
            {/* Etiqueta de Publicidad */}
            <div className="text-center mb-2">
                <span className="text-xs text-text-secondary bg-yellow-100 px-2 py-1 rounded-full">
                    📢 Publicidad
                </span>
            </div>
            
            <div className={`relative rounded-xl overflow-hidden shadow-lg ${currentStyle} text-white`}>
                <div className="p-6">
                    <div className="flex items-start justify-between">
                        {/* Contenido Principal */}
                        <div className="flex-1">
                            <div className="flex items-center mb-3">
                                {ad.cover_image && (
                                    <img 
                                        src={ad.cover_image} 
                                        alt={ad.title}
                                        className="w-16 h-16 rounded-lg object-cover mr-4 border-2 border-white/20"
                                    />
                                )}
                                <div>
                                    <h3 className="text-xl font-bold mb-1">{ad.title || 'Anuncio Promocional'}</h3>
                                    <p className="text-white/80 text-sm">{ad.category || 'Servicios'}</p>
                                </div>
                            </div>
                            
                            <p className="text-white/90 mb-4 leading-relaxed">
                                {ad.description || 'Descubre nuestros productos y servicios de calidad.'}
                            </p>
                            
                            {ad.company_info && (
                                <p className="text-white/70 text-sm mb-4">
                                    {ad.company_info}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    {/* Botones de Contacto */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {ad.contact_phone && (
                            <Button 
                                size="sm" 
                                variant="secondary" 
                                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                                onClick={() => handleContactClick('phone', ad.contact_phone)}
                            >
                                <Phone className="w-4 h-4 mr-1" />
                                Llamar
                            </Button>
                        )}
                        
                        {ad.contact_email && (
                            <Button 
                                size="sm" 
                                variant="secondary" 
                                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                                onClick={() => handleContactClick('email', ad.contact_email)}
                            >
                                <Mail className="w-4 h-4 mr-1" />
                                Email
                            </Button>
                        )}
                        
                        {ad.contact_website && (
                            <Button 
                                size="sm" 
                                variant="secondary" 
                                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                                onClick={() => handleContactClick('website', ad.contact_website)}
                            >
                                <Globe className="w-4 h-4 mr-1" />
                                Web
                            </Button>
                        )}
                        
                        <Button 
                            size="sm" 
                            variant="secondary" 
                            className="bg-white hover:bg-white/90 text-gray-900 font-semibold ml-auto"
                            onClick={() => handleContactClick('default')}
                        >
                            Ver Más <ExternalLink className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                    
                    {/* Indicador de tipo de anuncio */}
                    <div className="absolute top-4 right-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                            <span className="text-xs font-semibold">
                                {ad.duration === '30days' ? '⭐ Premium' : '📍 Promoción'}
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Patrón decorativo */}
                <div className="absolute inset-0 bg-white/5 opacity-50">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                </div>
            </div>
        </motion.div>
    );
};

export default AdCard;