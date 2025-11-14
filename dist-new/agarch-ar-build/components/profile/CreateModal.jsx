import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Send, Clock, X } from 'lucide-react';

const CreateModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handlePublicationClick = () => {
    onClose();
    navigate('/create-post');
  };

  const handleStoryClick = () => {
    onClose();
    // Abrir modal de historias
    // Por ahora navegamos a create-post pero con parámetro para historias
    navigate('/create-post?type=story');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="card-glass max-w-md mx-auto">
        <DialogHeader className="text-center">
          <DialogTitle>Crear</DialogTitle>
          <DialogDescription>
            Elige qué tipo de contenido quieres crear
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Botón Publicación */}
          <Button
            onClick={handlePublicationClick}
            className="w-full h-16 flex flex-col items-center justify-center gap-2 bg-primary hover:bg-primary/90"
          >
            <Send className="w-6 h-6" />
            <span className="text-lg font-semibold">Publicación</span>
          </Button>

          {/* Botón Historia */}
          <Button
            onClick={handleStoryClick}
            variant="outline"
            className="w-full h-16 flex flex-col items-center justify-center gap-2 border-2 border-primary text-primary hover:bg-primary hover:text-white"
          >
            <Clock className="w-6 h-6" />
            <span className="text-lg font-semibold">Historia</span>
          </Button>

          {/* Texto informativo */}
          <p className="text-sm text-muted-foreground text-center">
            Las historias desaparecen después de 24 horas.
          </p>

          {/* Recordatorio de normas */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="text-yellow-600 dark:text-yellow-400 mt-0.5">⚠️</div>
              <div className="text-sm">
                <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                  Recordatorio de Normas
                </p>
                <p className="text-yellow-700 dark:text-yellow-300">
                  PROHIBIDO fotos de menores, contenido ilegal, o pornografía infantil. 
                  Las cuentas que infrinjan estas normas serán eliminadas permanentemente.
                </p>
              </div>
            </div>
          </div>

          {/* Botón cancelar */}
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full"
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateModal;
