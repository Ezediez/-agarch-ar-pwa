import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronDown, Search } from 'lucide-react';

// Lista de países con códigos telefónicos y banderas
const countries = [
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
  { code: 'IT', name: 'Italia', dialCode: '+39', flag: '🇮🇹' },
  { code: 'FR', name: 'Francia', dialCode: '+33', flag: '🇫🇷' },
  { code: 'DE', name: 'Alemania', dialCode: '+49', flag: '🇩🇪' },
  { code: 'GB', name: 'Reino Unido', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'JP', name: 'Japón', dialCode: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'RU', name: 'Rusia', dialCode: '+7', flag: '🇷🇺' },
  { code: 'ZA', name: 'Sudáfrica', dialCode: '+27', flag: '🇿🇦' },
  { code: 'EG', name: 'Egipto', dialCode: '+20', flag: '🇪🇬' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenia', dialCode: '+254', flag: '🇰🇪' },
  { code: 'MA', name: 'Marruecos', dialCode: '+212', flag: '🇲🇦' },
  { code: 'TN', name: 'Túnez', dialCode: '+216', flag: '🇹🇳' },
  { code: 'DZ', name: 'Argelia', dialCode: '+213', flag: '🇩🇿' },
  { code: 'LY', name: 'Libia', dialCode: '+218', flag: '🇱🇾' },
  { code: 'SD', name: 'Sudán', dialCode: '+249', flag: '🇸🇩' },
  { code: 'ET', name: 'Etiopía', dialCode: '+251', flag: '🇪🇹' },
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
  { code: 'CI', name: 'Costa de Marfil', dialCode: '+225', flag: '🇨🇮' },
  { code: 'SN', name: 'Senegal', dialCode: '+221', flag: '🇸🇳' },
  { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫' },
  { code: 'NE', name: 'Níger', dialCode: '+227', flag: '🇳🇪' },
  { code: 'TD', name: 'Chad', dialCode: '+235', flag: '🇹🇩' },
  { code: 'CM', name: 'Camerún', dialCode: '+237', flag: '🇨🇲' },
  { code: 'CF', name: 'República Centroafricana', dialCode: '+236', flag: '🇨🇫' },
  { code: 'CD', name: 'República Democrática del Congo', dialCode: '+243', flag: '🇨🇩' },
  { code: 'CG', name: 'República del Congo', dialCode: '+242', flag: '🇨🇬' },
  { code: 'GA', name: 'Gabón', dialCode: '+241', flag: '🇬🇦' },
  { code: 'GQ', name: 'Guinea Ecuatorial', dialCode: '+240', flag: '🇬🇶' },
  { code: 'ST', name: 'Santo Tomé y Príncipe', dialCode: '+239', flag: '🇸🇹' },
  { code: 'AO', name: 'Angola', dialCode: '+244', flag: '🇦🇴' },
  { code: 'ZM', name: 'Zambia', dialCode: '+260', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabue', dialCode: '+263', flag: '🇿🇼' },
  { code: 'BW', name: 'Botsuana', dialCode: '+267', flag: '🇧🇼' },
  { code: 'NA', name: 'Namibia', dialCode: '+264', flag: '🇳🇦' },
  { code: 'SZ', name: 'Suazilandia', dialCode: '+268', flag: '🇸🇿' },
  { code: 'LS', name: 'Lesoto', dialCode: '+266', flag: '🇱🇸' },
  { code: 'MG', name: 'Madagascar', dialCode: '+261', flag: '🇲🇬' },
  { code: 'MU', name: 'Mauricio', dialCode: '+230', flag: '🇲🇺' },
  { code: 'SC', name: 'Seychelles', dialCode: '+248', flag: '🇸🇨' },
  { code: 'KM', name: 'Comoras', dialCode: '+269', flag: '🇰🇲' },
  { code: 'YT', name: 'Mayotte', dialCode: '+262', flag: '🇾🇹' },
  { code: 'RE', name: 'Reunión', dialCode: '+262', flag: '🇷🇪' },
  { code: 'DJ', name: 'Yibuti', dialCode: '+253', flag: '🇩🇯' },
  { code: 'SO', name: 'Somalia', dialCode: '+252', flag: '🇸🇴' },
  { code: 'ER', name: 'Eritrea', dialCode: '+291', flag: '🇪🇷' },
  { code: 'SS', name: 'Sudán del Sur', dialCode: '+211', flag: '🇸🇸' }
];

const PhoneInput = ({ 
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
      // Buscar el país que coincida con el código del número
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
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="phone-input" className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <div className="relative">
        {/* Selector de país */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors z-10"
          >
            <span className="text-lg">{selectedCountry.flag}</span>
            <span className="text-sm font-mono">{selectedCountry.dialCode}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown de países */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
              {/* Campo de búsqueda */}
              <div className="p-3 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Buscar país..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Lista de países */}
              <div className="max-h-48 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-3 ${
                      selectedCountry.code === country.code ? 'bg-blue-50 text-blue-600' : ''
                    }`}
                  >
                    <span className="text-lg">{country.flag}</span>
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
        <Input
          id="phone-input"
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="pl-24 pr-3"
        />
      </div>

      {/* Preview del número completo */}
      {phoneNumber && (
        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md">
          <span className="font-mono">
            {selectedCountry.dialCode} {phoneNumber}
          </span>
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
