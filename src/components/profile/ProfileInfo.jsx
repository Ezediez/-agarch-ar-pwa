import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Pencil, Save } from 'lucide-react';

const InfoItem = ({ label, value }) => (
  <div>
    <h4 className="font-medium text-primary">{label}</h4>
    <p className="text-text-primary capitalize">{value || 'No especificado'}</p>
  </div>
);

const ReadView = ({ data }) => (
  <div className="space-y-6 mt-6">
    <div>
      <h3 className="font-semibold text-primary mb-2">Sobre mí</h3>
      <p className="text-text-primary whitespace-pre-wrap">{data.bio || 'Aún no has agregado una descripción.'}</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <InfoItem label="Género" value={data.gender} />
      <InfoItem label="Orientación" value={data.sexual_orientation} />
      <InfoItem label="Estado" value={data.relationship_status} />
      <InfoItem label="Intereses" value={data.interests?.join(', ')} />
    </div>
  </div>
);

const EditView = ({ data, onInputChange, onSelectChange, onInterestsChange }) => {
    const selectContentClass = "bg-surface text-text-primary border-border-color";
    return (
      <div className="space-y-6 mt-6">
        <div>
          <Label htmlFor="bio" className="text-primary">Sobre mí</Label>
          <Textarea id="bio" name="bio" value={data.bio || ''} onChange={onInputChange} placeholder="Cuéntanos sobre ti..." className="input-glass mt-1" rows={4} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="gender" className="text-primary">Género</Label>
            <Select value={data.gender || ''} onValueChange={(value) => onSelectChange('gender', value)}>
              <SelectTrigger className="input-glass mt-1"><SelectValue placeholder="Selecciona tu género" /></SelectTrigger>
              <SelectContent className={selectContentClass}>
                <SelectItem value="Hombre">Hombre</SelectItem>
                <SelectItem value="Mujer">Mujer</SelectItem>
                <SelectItem value="No binario">No binario</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="sexual_orientation" className="text-primary">Orientación Sexual</Label>
            <Select value={data.sexual_orientation || ''} onValueChange={(value) => onSelectChange('sexual_orientation', value)}>
              <SelectTrigger className="input-glass mt-1"><SelectValue placeholder="Selecciona tu orientación" /></SelectTrigger>
              <SelectContent className={selectContentClass}>
                <SelectItem value="Heterosexual">Heterosexual</SelectItem>
                <SelectItem value="Homosexual">Homosexual</SelectItem>
                <SelectItem value="Bisexual">Bisexual</SelectItem>
                <SelectItem value="Pansexual">Pansexual</SelectItem>
                <SelectItem value="Asexual">Asexual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="relationship_status" className="text-primary">Estado sentimental</Label>
            <Select value={data.relationship_status || ''} onValueChange={(value) => onSelectChange('relationship_status', value)}>
              <SelectTrigger className="input-glass mt-1"><SelectValue placeholder="¿Qué buscas?" /></SelectTrigger>
              <SelectContent className={selectContentClass}>
                <SelectItem value="Soltero/a">Soltero/a</SelectItem>
                <SelectItem value="En una relación">En una relación</SelectItem>
                <SelectItem value="Es complicado">Es complicado</SelectItem>
                <SelectItem value="Buscando algo casual">Algo casual</SelectItem>
                <SelectItem value="Amistad">Amistad</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="interests" className="text-primary">Intereses (separados por comas)</Label>
            <Input id="interests" name="interests" value={Array.isArray(data.interests) ? data.interests.join(', ') : ''} onChange={onInterestsChange} placeholder="Música, viajes, arte..." className="input-glass mt-1" />
          </div>
        </div>
      </div>
    );
}

const ProfileInfo = ({ profile, isOwnProfile, onSave, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);

    if (!profile) return null;

    return (
        <div className="card-glass p-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-primary">Información</h3>
                {isOwnProfile && (
                    <Button onClick={() => isEditing ? onSave() : setIsEditing(true)} variant="ghost" size="icon">
                        {isEditing ? <Save className="h-5 w-5 text-green-500" /> : <Pencil className="h-5 w-5" />}
                    </Button>
                )}
            </div>

            {isEditing ? (
                <EditView 
                  data={profile}
                  onInputChange={e => onUpdate({ ...profile, [e.target.name]: e.target.value })}
                  onSelectChange={(key, value) => onUpdate({ ...profile, [key]: value })}
                  onInterestsChange={e => onUpdate({ ...profile, interests: e.target.value.split(',').map(s => s.trim()) })}
                />
            ) : (
                <ReadView data={profile} />
            )}
        </div>
    );
};

export default ProfileInfo;
