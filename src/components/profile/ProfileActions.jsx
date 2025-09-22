import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Edit, Save, X, Loader2, Video, Image as ImageIcon, Sparkles } from 'lucide-react';
import CreateStoryModal from './CreateStoryModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";

const ProfileActions = ({ editMode, onEditToggle, onSave, onOpenUploadModal, saveLoading }) => {
  const [showStoryModal, setShowStoryModal] = useState(false);

  return (
    <motion.div
      className="mt-6 flex flex-wrap gap-2 justify-center w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <Button onClick={onEditToggle} variant={editMode ? 'secondary' : 'default'} className="flex-1">
        {editMode ? <X className="mr-2 h-4 w-4" /> : <Edit className="mr-2 h-4 w-4" />}
        {editMode ? 'Cancelar' : 'Editar Perfil'}
      </Button>

      {editMode ? (
        <Button onClick={onSave} disabled={saveLoading} className="flex-1 bg-green-500 hover:bg-green-600">
          {saveLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex-1">
              <Camera className="mr-2 h-4 w-4" />
              Crear
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="card-glass">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ImageIcon className="mr-2 h-4 w-4" />
                <span>Subir Foto</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="card-glass">
                  <DropdownMenuItem onClick={() => onOpenUploadModal('camera-gallery')}>
                    <Camera className="mr-2 h-4 w-4" />
                    <span>Tomar Foto</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenUploadModal('gallery')}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    <span>Desde Galería</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Video className="mr-2 h-4 w-4" />
                <span>Subir Shoot</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="card-glass">
                  <DropdownMenuItem onClick={() => onOpenUploadModal('camera-video')}>
                    <Camera className="mr-2 h-4 w-4" />
                    <span>Grabar Video</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onOpenUploadModal('video')}>
                    <Video className="mr-2 h-4 w-4" />
                    <span>Desde Galería</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuItem onClick={() => setShowStoryModal(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              <span>Crear Historia</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Modal de crear historia */}
      <CreateStoryModal
        isOpen={showStoryModal}
        onClose={() => setShowStoryModal(false)}
      />
    </motion.div>
  );
};

export default ProfileActions;
