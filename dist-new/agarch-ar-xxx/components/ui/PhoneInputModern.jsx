import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, Search, Phone } from 'lucide-react';

// Lista de países más populares primero
const countries = [
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦' },
  { code: 'IT', name: 'Italia', dialCode: '+39', flag: '🇮🇹' },
  { code: 'FR', name: 'Francia', dialCode: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemania', dialCode: '+49', flag: '🇩🇪' },
  { code: 'GB', name: 'Reino Unido', dialCode: '+44', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'JP', name: 'Japón', dialCode: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  // Agregar más países según necesidad
];

const PhoneInputModern = ({ 
  value = '', 
  onChange, 
  label = 'Teléfono', 
  placeholder = 'Número de teléfono',
  className = '',
  required = false,
  disabled = false
}) => {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); // Argentina por defecto
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  // Filtrar países basado en la búsqueda
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.dialCode.includes(searchTerm)
  );

  // Actualizar el valor del teléfono cuando cambia el país o el número
  useEffect(() => {
    const fullPhoneNumber = `${selectedCountry.dialCode} ${phoneNumber}`.trim();
    onChange?.(fullPhoneNumber);
  }, [selectedCountry, phoneNumber, onChange]);

  // Inicializar con el valor existente si se proporciona
  useEffect(() => {
    if (value) {
      const matchingCountry = countries.find(country => 
        value.startsWith(country.dialCode)
      );
      
      if (matchingCountry) {
        setSelectedCountry(matchingCountry);
        setPhoneNumber(value.replace(matchingCountry.dialCode, '').trim());
      }
    }
  }, [value]);

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus en el campo de búsqueda cuando se abre el dropdown
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handlePhoneChange = (e) => {
    setPhoneNumber(e.target.value);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label htmlFor="phone-input" className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        {/* Contenedor principal del input */}
        <div className="relative flex items-center bg-white border border-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          
          {/* Selector de país - Estilo WhatsApp */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              disabled={disabled}
              className="flex items-center gap-2 px-4 py-3 border-r border-gray-300 hover:bg-gray-50 transition-colors rounded-l-xl"
            >
              <span className="text-xl">{selectedCountry.flag}</span>
              <span className="text-sm font-semibold text-gray-700">{selectedCountry.dialCode}</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown de países - Estilo moderno */}
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                {/* Campo de búsqueda */}
                <div className="p-4 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder="Buscar país o código..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Lista de países */}
                <div className="max-h-64 overflow-y-auto">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 ${
                        selectedCountry.code === country.code ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <span className="text-xl">{country.flag}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{country.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{country.dialCode}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Campo de número de teléfono */}
          <div className="flex-1 relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="phone-input"
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder={placeholder}
              required={required}
              disabled={disabled}
              className="w-full pl-10 pr-4 py-3 border-0 focus:outline-none text-gray-700 placeholder-gray-400 rounded-r-xl"
            />
          </div>
        </div>

        {/* Preview del número completo - Estilo elegante */}
        {phoneNumber && (
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-mono text-blue-700">
              {selectedCountry.dialCode} {phoneNumber}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneInputModern;
