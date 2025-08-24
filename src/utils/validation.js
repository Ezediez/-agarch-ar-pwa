export const validatePassword = (password) => {
  const minLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    isValid: minLength && hasUppercase && hasSymbol,
    errors: {
      minLength: !minLength ? 'La contraseña debe tener al menos 8 caracteres' : null,
      hasUppercase: !hasUppercase ? 'Debe contener al menos una mayúscula' : null,
      hasSymbol: !hasSymbol ? 'Debe contener al menos un símbolo' : null
    }
  };
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateDNI = (dni) => {
  const dniRegex = /^\d{7,8}$/;
  return dniRegex.test(dni);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const containsProhibitedContent = (text) => {
  const prohibitedWords = [
    'menor', 'niño', 'niña', 'infantil', 'pedofil', 'animal', 'zoofil',
    'idiota', 'estúpido', 'negro de mierda', 'judío', 'maricón', 'puto', 'puta madre'
  ];
  
  const lowerText = text.toLowerCase();
  return prohibitedWords.some(word => lowerText.includes(word));
};

export const containsCommercialContent = (text) => {
  const commercialWords = [
    'pago', 'dinero', 'precio', 'tarifa', 'cobro', 'prostitut', 'escort', 
    'servicio sexual', 'por plata', 'por dinero', 'webcam pago'
  ];
  
  const lowerText = text.toLowerCase();
  return commercialWords.some(word => lowerText.includes(word));
};

export const containsContactInfo = (text) => {
  const phoneRegex = /(\+?\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}/;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const whatsappRegex = /(whatsapp|wsp|wa\.me)/i;
  
  return phoneRegex.test(text) || emailRegex.test(text) || whatsappRegex.test(text);
};