import React from 'react';
import { useToast } from '@/components/ui/use-toast.jsx';
import { Phone, Mail, Globe, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdFeedCard = ({ ad }) => {
  const { toast } = useToast();

  const handleContact = (type, value) => {
    // Si es banner promocional, manejar diferente
    if (ad.type === 'promo') {
      switch (ad.promo_type) {
        case 'VIP':
          toast({
            title: "🎯 VIP - Funcionalidad en desarrollo",
            description: "Muy pronto podrás obtener VIP para destacar tu perfil.",
            duration: 3000,
          });
          break;
        case 'AUTOMARKET':
          window.open(ad.website, '_blank');
          break;
        default:
          break;
      }
      return;
    }

    // Mostrar advertencia de salida
    toast({
      title: "⚠️ Salir de la app",
      description: "Estás saliendo de la aplicación para contactar al anunciante.",
      duration: 3000,
    });

    setTimeout(() => {
      switch (type) {
        case 'contact_phone':
          window.location.href = `tel:${value}`;
          break;
        case 'contact.email':
          window.location.href = `mailto:${value}`;
          break;
        case 'website':
          window.open(value, '_blank');
          break;
        case 'whatsapp':
          window.open(`https://wa.me/${value.replace(/[^0-9]/g, '')}`, '_blank');
          break;
        default:
          break;
      }
    }, 1500);
  };

  // Diferentes estilos de banner para variedad
  const bannerStyles = [
    'bg-gradient-to-br from-blue-500 to-purple-600',
    'bg-gradient-to-br from-green-500 to-teal-600',
    'bg-gradient-to-br from-orange-500 to-red-600',
    'bg-gradient-to-br from-pink-500 to-rose-600',
    'bg-gradient-to-br from-indigo-500 to-blue-600',
  ];

  const randomStyle = bannerStyles[Math.floor(Math.random() * bannerStyles.length)];

  return (
    <div className={`${randomStyle} rounded-lg p-4 text-white relative overflow-hidden`}>
      {/* Fondo decorativo */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8" />
      
      <div className="relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
<<<<<<< HEAD
        <div className="bg-white/20 px-2 py-1 rounded-full">
          <span className="text-xs font-medium">
            {ad.type === 'promo' ? 'PROMOCIÓN' : 'PUBLICIDAD'}
          </span>
=======
        <div className="flex gap-2">
          <div className="bg-white/20 px-2 py-1 rounded-full">
            <span className="text-xs font-medium">
              {ad.type === 'promo' ? 'PROMOCIÓN' : 'PUBLICIDAD'}
            </span>
          </div>
          {ad.ad_type && ad.ad_type !== 'promo' && (
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              ad.ad_type === 'premium' 
                ? 'bg-yellow-400/30 text-yellow-200' 
                : 'bg-blue-400/30 text-blue-200'
            }`}>
              {ad.ad_type === 'premium' ? '⭐ PREMIUM' : '📢 ESTÁNDAR'}
            </div>
          )}
>>>>>>> e98d0969fab7ef9b0b980963a8c51206a79171da
        </div>
        <ExternalLink className="w-4 h-4 opacity-70" />
      </div>

      {/* Contenido */}
      <div className="mb-4">
        <h3 className="font-bold text-lg mb-1">{ad.title || 'Anuncio'}</h3>
        <p className="text-white/90 text-sm mb-2">
          {ad.description || 'Descripción del anuncio'}
        </p>
        {ad.company_info && (
          <p className="text-white/80 text-xs">
            {ad.company_info}
          </p>
        )}
        {ad.price && (
          <p className="text-white/80 text-xs font-bold">
            ${ad.price} USD
          </p>
        )}
      </div>

        {/* Botones de contacto */}
        <div className="grid grid-cols-2 gap-2">
          {ad.type === 'promo' ? (
            // Botones especiales para banners promocionales
            ad.promo_type === 'VIP' ? (
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs"
                onClick={() => handleContact()}
              >
                <span>🚀</span>
                Obtener VIP
              </Button>
            ) : ad.promo_type === 'AUTOMARKET' ? (
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs"
                onClick={() => handleContact()}
              >
                <Globe className="w-3 h-3 mr-1" />
                Ver AutoMarket
              </Button>
            ) : null
          ) : (
            // Botones normales de contacto para anuncios reales
            <>
              {ad.contact_phone && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs"
                  onClick={() => handleContact('phone', ad.contact_phone)}
                >
                  <Phone className="w-3 h-3 mr-1" />
                  Llamar
                </Button>
              )}
              {ad.contact_email && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs"
                  onClick={() => handleContact('email', ad.contact_email)}
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Email
                </Button>
              )}
              {ad.contact_website && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs"
                  onClick={() => handleContact('website', ad.contact_website)}
                >
                  <Globe className="w-3 h-3 mr-1" />
                  Web
                </Button>
              )}
              {ad.contact_whatsapp && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-0 text-xs"
                  onClick={() => handleContact('whatsapp', ad.contact_whatsapp)}
                >
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  WhatsApp
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdFeedCard;
