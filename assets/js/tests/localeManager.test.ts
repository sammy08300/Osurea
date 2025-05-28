import localeManagerInstance from '../../locales/index.js'; // Default import
import { Locale } from '../../locales/index.js'; // Named import for the type

// Mock localStorage
let mockStorage: { [key: string]: string } = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { mockStorage = {}; }
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock navigator.language
const navigatorMock = {
  language: '',
  userLanguage: ''
};
Object.defineProperty(window, 'navigator', { value: navigatorMock, configurable: true });

// Mock document.documentElement.lang
Object.defineProperty(document.documentElement, 'lang', {
  value: '',
  writable: true,
  configurable: true
});


// Provide mock translation data directly for testing
// This avoids needing to mock the dynamic import() of en.js, es.js, fr.js
const mockEnLocale: Locale = {
  app: { title: 'Area Visualizer EN', description: 'Description EN' },
  tablet: { settings: 'Tablet Settings EN', model: 'Tablet Model EN', selectModel: "Select a model EN", search: "Search... EN", searchTablet: "Search for a tablet... EN", custom: "Custom tablet EN", customDimensions: "Custom dimensions EN", width: "Tablet width EN", height: "Tablet height EN", units: "mm EN", rotation: "Tablet rotation EN", degrees: "degrees EN" },
  area: { settings: 'Area Settings EN', width: 'Area Width EN', height: 'Area Height EN', radius: "Border radius EN", ratio: "Ratio EN", lockRatio: "Lock ratio EN", position: "Area position EN", positionX: "X Position EN", positionY: "Y Position EN", center: "Center EN", swap: "Reverse EN", drag: "Drag the area to position it EN", rightClick: "Right-click for more options EN" },
  visual: { options: 'Visual Options EN', showGrid: "Grid EN", snapGrid: "Snap to grid EN", visualization: "Visualization EN" },
  favorites: { title: 'Favorites EN', noFavorites: "No favorites EN", save: "Save EN", name: "Favorite name EN", namePlaceholder: "Favorite name (optional) EN", description: "Description EN", descriptionPlaceholder: "Description (optional) EN", defaultName: "Saved configuration EN", saveButton: "Save EN", cancelButton: "Cancel EN", deleteButton: "Delete EN", editButton: "Edit EN", sortBy: "Sort by EN", sortDate: "Date EN", sortName: "Name EN", sortSize: "Size EN", sortModified: "Modified EN", creationDate: "Creation: EN", lastModified: "Last modified: EN", dates: "Dates EN", dimensions: "Dimensions: EN", surfaceArea: "Surface: EN", load: "Load EN", deleteConfirm: "Confirm deletion EN", warning: "Warning EN", confirmModification: "Confirm modification EN", deleteWarning: "Are you sure you want to delete this configuration? This action cannot be undone. EN", itemTitle: "Title EN" },
  summary: { title: 'Summary EN', currentConfig: "Current configuration EN", copyInfo: "Copy EN", copied: "Copied! EN" },
  alignment: { title: "Area Positioning EN", center: "Center EN", left: "Left EN", right: "Right EN", top: "Top EN", bottom: "Bottom EN", topLeft: "Top-Left EN", topRight: "Top-Right EN", bottomLeft: "Bottom-Left EN", bottomRight: "Bottom-Right EN" },
  messages: { confirmDelete: "Are you sure you want to delete this favorite? EN", yes: "Yes EN", no: "No EN", somethingWrong: "Something went wrong. EN", noConnection: "You are offline, but Osu!rea still works! EN", offlineFeature: "This feature requires an internet connection. EN" },
  language: { title: 'Language EN', fr: 'Français', en: 'English', es: 'Español', autoDetect: 'Auto-detect EN' },
  footer: { credit: "Designed by Yuzuctus EN", description: "Tool description EN", tabletSettings: "Tablet Settings EN", spreadsheets: "Spreadsheets EN", otherProjects: "Other projects EN" },
  notifications: { favoriteNotFound: "Favorite not found EN", configurationLoaded: "Configuration loaded EN", errorLoadingConfig: "Error loading config EN", editModeActivated: "Edit mode activated EN", editModeCanceled: "Edit mode canceled EN", favoriteDeleted: "Favorite deleted EN", errorDeletingFavorite: "Error deleting favorite EN", configurationUpdated: "Configuration updated EN", errorUpdatingConfig: "Error updating config EN", titleTruncated: "Title truncated EN", descriptionTruncated: "Description truncated EN", configurationSaved: "Configuration saved EN", errorSavingConfig: "Error saving config EN", areaPositionCenter: "Area centered EN", areaPositionLeft: "Area left EN", areaPositionRight: "Area right EN", areaPositionTop: "Area top EN", areaPositionBottom: "Area bottom EN", areaPositionTopLeft: "Area top-left EN", areaPositionTopRight: "Area top-right EN", areaPositionBottomLeft: "Area bottom-left EN", areaPositionBottomRight: "Area bottom-right EN", copiedInfo: "Info copied EN", copyError: "Copy error EN", invalidDimensions: "Invalid dimensions EN", tabletDataError: "Tablet data error EN", errorSavingPreferences: "Error saving preferences EN", preferencesReset: "Preferences reset EN" },
};
const mockEsLocale: Locale = {
  app: { title: 'Visualizador de Área ES', description: 'Descripción ES' },
  tablet: { settings: 'Configuración de Tableta ES', model: 'Modelo de Tableta ES', selectModel: "Seleccionar un modelo ES", search: "Buscar... ES", searchTablet: "Buscar una tableta... ES", custom: "Tableta personalizada ES", customDimensions: "Dimensiones personalizadas ES", width: "Ancho de la tableta ES", height: "Alto de la tableta ES", units: "mm ES", rotation: "Rotación de la tableta ES", degrees: "grados ES" },
  area: { settings: 'Configuración del Área ES', width: 'Ancho del Área ES', height: 'Alto del Área ES', radius: "Radio del borde ES", ratio: "Proporción ES", lockRatio: "Bloquear proporción ES", position: "Posición del área ES", positionX: "Posición X ES", positionY: "Posición Y ES", center: "Centrar ES", swap: "Intercambiar ES", drag: "Arrastra el área para posicionarla ES", rightClick: "Clic derecho para más opciones ES" },
  visual: { options: 'Opciones Visuales ES', showGrid: "Cuadrícula ES", snapGrid: "Ajustar a la cuadrícula ES", visualization: "Visualización ES" },
  favorites: { title: 'Favoritos ES', noFavorites: "No hay favoritos ES", save: "Guardar ES", name: "Nombre del favorito ES", namePlaceholder: "Nombre del favorito (opcional) ES", description: "Descripción ES", descriptionPlaceholder: "Descripción (opcional) ES", defaultName: "Configuración guardada ES", saveButton: "Guardar ES", cancelButton: "Cancelar ES", deleteButton: "Eliminar ES", editButton: "Editar ES", sortBy: "Ordenar por ES", sortDate: "Fecha ES", sortName: "Nombre ES", sortSize: "Tamaño ES", sortModified: "Modificado ES", creationDate: "Creación: ES", lastModified: "Última modificación: ES", dates: "Fechas ES", dimensions: "Dimensiones: ES", surfaceArea: "Superficie: ES", load: "Cargar ES", deleteConfirm: "Confirmar eliminación ES", warning: "Advertencia ES", confirmModification: "Confirmar modificación ES", deleteWarning: "Are you sure you want to delete this configuration? This action cannot be undone. ES", itemTitle: "Título ES" },
  summary: { title: 'Resumen ES', currentConfig: "Configuración actual ES", copyInfo: "Copiar ES", copied: "¡Copiado! ES" },
  alignment: { title: "Posicionamiento del Área ES", center: "Centro ES", left: "Izquierda ES", right: "Derecha ES", top: "Arriba ES", bottom: "Abajo ES", topLeft: "Arriba-Izquierda ES", topRight: "Arriba-Derecha ES", bottomLeft: "Abajo-Izquierda ES", bottomRight: "Abajo-Derecha ES" },
  messages: { confirmDelete: "¿Estás seguro de que quieres eliminar este favorito? ES", yes: "Sí ES", no: "No ES", somethingWrong: "Algo salió mal. ES", noConnection: "Estás sin conexión, pero Osu!rea sigue funcionando. ES", offlineFeature: "Esta función requiere conexión a internet. ES" },
  language: { title: 'Idioma ES', fr: 'Francés', en: 'Inglés', es: 'Español', autoDetect: 'Auto-detectar ES' },
  footer: { credit: "Diseñado por Yuzuctus ES", description: "Descripción de herramienta ES", tabletSettings: "Configuración de Tableta ES", spreadsheets: "Hojas de cálculo ES", otherProjects: "Otros proyectos ES" },
  notifications: { favoriteNotFound: "Favorito no encontrado ES", configurationLoaded: "Configuración cargada ES", errorLoadingConfig: "Error cargando config ES", editModeActivated: "Modo edición activado ES", editModeCanceled: "Modo edición cancelado ES", favoriteDeleted: "Favorito eliminado ES", errorDeletingFavorite: "Error eliminando favorito ES", configurationUpdated: "Configuración actualizada ES", errorUpdatingConfig: "Error actualizando config ES", titleTruncated: "Título truncado ES", descriptionTruncated: "Descripción truncada ES", configurationSaved: "Configuración guardada ES", errorSavingConfig: "Error guardando config ES", areaPositionCenter: "Área centrada ES", areaPositionLeft: "Área izquierda ES", areaPositionRight: "Área derecha ES", areaPositionTop: "Área arriba ES", areaPositionBottom: "Área abajo ES", areaPositionTopLeft: "Área arriba-izquierda ES", areaPositionTopRight: "Área arriba-derecha ES", areaPositionBottomLeft: "Área abajo-izquierda ES", areaPositionBottomRight: "Área abajo-derecha ES", copiedInfo: "Info copiada ES", copyError: "Error copiando ES", invalidDimensions: "Dimensiones inválidas ES", tabletDataError: "Error datos tableta ES", errorSavingPreferences: "Error guardando preferencias ES", preferencesReset: "Preferencias reseteadas ES" },
};


// Override the actual translations in localeManagerInstance with mocks
localeManagerInstance.translations = {
  en: mockEnLocale,
  es: mockEsLocale,
  // fr: mockFrLocale, // Not adding fr to test fallback behavior
};
// Also update flatTranslations if your tests rely on them or if LocaleManager uses them internally
localeManagerInstance.flatTranslations = {
    en: localeManagerInstance['flattenTranslations'](mockEnLocale),
    es: localeManagerInstance['flattenTranslations'](mockEsLocale),
};
localeManagerInstance.availableLocales = ['en', 'es'];


describe('LocaleManager', () => {
  beforeEach(() => {
    localStorageMock.clear();
    navigatorMock.language = '';
    navigatorMock.userLanguage = '';
    document.documentElement.lang = '';
    // Reset to a known default locale before each test
    localeManagerInstance.currentLocale = 'en'; 
    // Re-initialize with mocks, ensuring it picks up the mocked translations/locales
    // This is a bit of a hack; ideally, LocaleManager would be a class we can instantiate.
    Object.assign(localeManagerInstance, {
        translations: { en: mockEnLocale, es: mockEsLocale },
        flatTranslations: { 
            en: localeManagerInstance['flattenTranslations'](mockEnLocale),
            es: localeManagerInstance['flattenTranslations'](mockEsLocale),
        },
        availableLocales: ['en', 'es'],
        currentLocale: 'en' // Start with 'en'
    });
    localeManagerInstance['initializeLocale'](); // Call private method for re-initialization
  });

  describe('Language Initialization', () => {
    test('should default to "en" if no saved locale or browser language', () => {
      localeManagerInstance['initializeLocale']();
      expect(localeManagerInstance.getCurrentLocale()).toBe('en');
    });

    test('should load locale from localStorage if available', () => {
      localStorageMock.setItem('osureaLocale', 'es');
      localeManagerInstance['initializeLocale']();
      expect(localeManagerInstance.getCurrentLocale()).toBe('es');
    });

    test('should detect browser language if localStorage is not set', () => {
      navigatorMock.language = 'es-ES';
      localeManagerInstance['initializeLocale']();
      expect(localeManagerInstance.getCurrentLocale()).toBe('es');
    });
    
    test('should use userLanguage if language is not available', () => {
      (navigatorMock as any).language = undefined; // Ensure language is undefined
      navigatorMock.userLanguage = 'es-MX';
      localeManagerInstance['initializeLocale']();
      expect(localeManagerInstance.getCurrentLocale()).toBe('es');
    });

    test('should fallback to "en" if browser language is unsupported', () => {
      navigatorMock.language = 'de-DE'; // German, unsupported
      localeManagerInstance['initializeLocale']();
      expect(localeManagerInstance.getCurrentLocale()).toBe('en');
    });
  });

  describe('setLocale', () => {
    test('should switch to a new language and update dependencies', async () => {
      await localeManagerInstance.setLocale('es');
      expect(localeManagerInstance.getCurrentLocale()).toBe('es');
      expect(localStorageMock.getItem('osureaLocale')).toBe('es');
      expect(document.documentElement.lang).toBe('es');
    });

    test('should not switch if locale is unavailable and default to "en"', async () => {
      await localeManagerInstance.setLocale('fr'); // 'fr' is not in our mocked availableLocales
      expect(localeManagerInstance.getCurrentLocale()).toBe('en'); // Fallback behavior
    });
  });

  describe('translate', () => {
    beforeEach(async () => {
      await localeManagerInstance.setLocale('en'); // Ensure English is set
    });

    test('should retrieve a simple key in the current language', () => {
      expect(localeManagerInstance.translate('language.en')).toBe('English');
    });

    test('should retrieve a nested key', () => {
      expect(localeManagerInstance.translate('app.title')).toBe('Area Visualizer EN');
    });

    test('should return the key itself if not found', () => {
      expect(localeManagerInstance.translate('nonexistent.key')).toBe('nonexistent.key');
    });

    test('should fall back to English if key is missing in current language (es) but exists in en', async () => {
      await localeManagerInstance.setLocale('es');
      // Assuming 'app.description' exists in 'en' but we'll simulate it missing in 'es'
      // by not adding it to mockEsLocale or ensuring it's different.
      // For this test, we rely on getTranslationByPath's fallback logic.
      // Let's add a key that only EN has:
      (mockEnLocale.app as any).onlyInEn = "Only in EN";
      localeManagerInstance.translations.en = mockEnLocale; // Re-assign to ensure test data
      localeManagerInstance.flatTranslations.en = localeManagerInstance['flattenTranslations'](mockEnLocale);


      expect(localeManagerInstance.translate('app.onlyInEn')).toBe('Only in EN');
    });
    
    test('should return the key if missing in both current (es) and fallback (en)', async () => {
        await localeManagerInstance.setLocale('es');
        expect(localeManagerInstance.translate('completely.nonexistent.key')).toBe('completely.nonexistent.key');
    });
  });

  describe('getAvailableLocales and getCurrentLocale', () => {
    test('getAvailableLocales should return available locales', () => {
      expect(localeManagerInstance.getAvailableLocales()).toEqual(['en', 'es']);
    });

    test('getCurrentLocale should return the current locale', () => {
      localeManagerInstance.currentLocale = 'es';
      expect(localeManagerInstance.getCurrentLocale()).toBe('es');
    });
  });
  
  // Test for flattenTranslations (private, but can be tested via flatTranslations property)
  describe('flattenTranslations', () => {
    test('should correctly flatten a nested locale object', () => {
        const flatEn = localeManagerInstance.flatTranslations.en;
        expect(flatEn['app_title']).toBe('Area Visualizer EN');
        expect(flatEn['tablet_settings']).toBe('Tablet Settings EN');
        expect(flatEn['language_autoDetect']).toBe('Auto-detect EN');
    });
  });

  // Test for getTranslationByPath (private, but tested via translate method indirectly)
  // Adding a more direct test if possible, or ensuring translate covers its paths
  describe('getTranslationByPath direct-like test', () => {
    test('should retrieve nested key using path mechanism (simulated)', () => {
        // This relies on translate calling getTranslationByPath internally
        expect(localeManagerInstance.translate('tablet.customDimensions')).toBe('Custom dimensions EN');
    });
  });

});

// Minimal Jest setup if not already present globally by a test runner
if (typeof describe === 'undefined') {
    global.describe = (name, fn) => fn();
    global.test = (name, fn) => fn();
    global.expect = (val) => ({
        toBe: (exp) => { if (val !== exp) throw new Error(`Expected ${val} to be ${exp}`); },
        toEqual: (exp) => { if (JSON.stringify(val) !== JSON.stringify(exp)) throw new Error(`Expected ${JSON.stringify(val)} to equal ${JSON.stringify(exp)}`); },
        // Add more matchers if needed by tests
    });
    (global as any).beforeEach = (fn: Function) => fn();
}
