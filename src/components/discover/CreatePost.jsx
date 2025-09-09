import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';

const CreatePost = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
  
    return (
      <div className="mb-6 p-4 rounded-lg card-glass">
        <div className="flex items-center gap-3">
          <img
            src={profile?.profile_picture_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100'}
            alt="Tu perfil"
            className="w-10 h-10 rounded-full object-cover"
          />
          <Input
            placeholder="¿Qué estás buscando?"
            className="flex-1 input-glass cursor-pointer"
            onClick={() => navigate('/create-post')}
            readOnly
          />
          <button onClick={() => navigate('/create-post')}>
            <ImageIcon className="w-6 h-6 text-primary hover:text-green-300 transition-colors"/>
          </button>
        </div>
      </div>
    );
};

export default CreatePost;
