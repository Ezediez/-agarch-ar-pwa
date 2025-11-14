export const postTemplates = [
  {
    id: 'sunset-glow',
    label: 'Atardecer',
    background: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)',
    defaultTextColor: '#ffffff',
  },
  {
    id: 'ocean-breeze',
    label: 'Oceánico',
    background: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
    defaultTextColor: '#ffffff',
  },
  {
    id: 'violet-dream',
    label: 'Violeta',
    background: 'linear-gradient(135deg, #b24592 0%, #f15f79 100%)',
    defaultTextColor: '#ffffff',
  },
  {
    id: 'sunrise-peach',
    label: 'Amanecer',
    background: 'linear-gradient(135deg, #fad961 0%, #f76b1c 100%)',
    defaultTextColor: '#3f3f46',
  },
  {
    id: 'mint-fresh',
    label: 'Menta',
    background: 'linear-gradient(135deg, #a3bded 0%, #6991c7 50%, #1e3c72 100%)',
    defaultTextColor: '#ffffff',
  },
  {
    id: 'night-sky',
    label: 'Noche',
    background: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
    defaultTextColor: '#f5f5f5',
  },
];

export const textColorOptions = [
  '#ffffff',
  '#1f2937',
  '#fef08a',
  '#fca5a5',
  '#f97316',
  '#38bdf8',
];

export const getTemplateById = (templateId) =>
  postTemplates.find((template) => template.id === templateId) || null;

