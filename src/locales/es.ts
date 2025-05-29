interface App {
    title: string;
    description: string;
}

interface Tablet {
    settings: string;
    model: string;
    selectModel: string;
    search: string;
    searchTablet: string;
    custom: string;
    customDimensions: string;
    width: string;
    height: string;
    units: string;
    rotation: string;
    degrees: string;
}

interface Area {
    settings: string;
    width: string;
    height: string;
    radius: string;
    ratio: string;
    lockRatio: string;
    position: string;
    positionX: string;
    positionY: string;
    center: string;
    swap: string;
    drag: string;
    rightClick: string;
}

interface Visual {
    options: string;
    showGrid: string;
    snapGrid: string;
    visualization: string;
}

interface Favorites {
    title: string;
    noFavorites: string;
    save: string;
    name: string;
    namePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    defaultName: string;
    saveButton: string;
    cancelButton: string;
    deleteButton: string;
    editButton: string;
    sortBy: string;
    sortDate: string;
    sortName: string;
    sortSize: string;
    sortModified: string;
    creationDate: string;
    lastModified: string;
    dates: string;
    dimensions: string;
    surfaceArea: string;
    load: string;
    deleteConfirm: string;
    warning: string;
    confirmModification: string;
    deleteWarning: string;
    itemTitle: string;
}

interface Summary {
    title: string;
    currentConfig: string;
    copyInfo: string;
    copied: string;
}

interface Alignment {
    title: string;
    center: string;
    left: string;
    right: string;
    top: string;
    bottom: string;
    topLeft: string;
    topRight: string;
    bottomLeft: string;
    bottomRight: string;
}

interface Messages {
    confirmDelete: string;
    yes: string;
    no: string;
    somethingWrong: string;
    noConnection: string;
    offlineFeature: string;
}

interface Language {
    title: string;
    fr: string;
    en: string;
    es: string;
    autoDetect: string;
}

interface Footer {
    credit: string;
    description: string;
    tabletSettings: string;
    spreadsheets: string;
    otherProjects: string;
}

interface Notifications {
    favoriteNotFound: string;
    configurationLoaded: string;
    errorLoadingConfig: string;
    editModeActivated: string;
    editModeCanceled: string;
    favoriteDeleted: string;
    errorDeletingFavorite: string;
    configurationUpdated: string;
    errorUpdatingConfig: string;
    titleTruncated: string;
    descriptionTruncated: string;
    configurationSaved: string;
    errorSavingConfig: string;
    areaPositionCenter: string;
    areaPositionLeft: string;
    areaPositionRight: string;
    areaPositionTop: string;
    areaPositionBottom: string;
    areaPositionTopLeft: string;
    areaPositionTopRight: string;
    areaPositionBottomLeft: string;
    areaPositionBottomRight: string;
    copiedInfo: string;
    copyError: string;
    invalidDimensions: string;
    tabletDataError: string;
    errorSavingPreferences: string;
    preferencesReset: string;
}

interface Locale {
    app: App;
    tablet: Tablet;
    area: Area;
    visual: Visual;
    favorites: Favorites;
    summary: Summary;
    alignment: Alignment;
    messages: Messages;
    language: Language;
    footer: Footer;
    notifications: Notifications;
}

const es: Locale = {
    // General application information
    app: {
        title: "Visualizador de Área",
        description: "Visualizador de área para jugadores de osu! que usan tableta gráfica. Configura y visualiza tu área activa con precisión, guarda tus configuraciones como favoritos y compártelas."
    },
    
    // Tablet settings
    tablet: {
        settings: "Configuración de la Tableta",
        model: "Modelo de Tableta",
        selectModel: "Seleccionar un modelo",
        search: "Buscar...",
        searchTablet: "Buscar una tableta...",
        custom: "Tableta personalizada",
        customDimensions: "Dimensiones personalizadas",
        width: "Ancho de la tableta",
        height: "Alto de la tableta",
        units: "mm",
        rotation: "Rotación de la tableta",
        degrees: "grados"
    },
    
    // Configuration de la zone active
    area: {
        settings: "Configuración del Área",
        width: "Ancho del área",
        height: "Alto del área",
        radius: "Radio de borde",
        ratio: "Proporción",
        lockRatio: "Bloquear proporción",
        position: "Posición del área",
        positionX: "Posición X",
        positionY: "Posición Y",
        center: "Centrar",
        swap: "Intercambiar",
        drag: "Arrastra el área para posicionarla",
        rightClick: "Clic derecho para más opciones"
    },
    
    // Options visuelles
    visual: {
        options: "Opciones Visuales",
        showGrid: "Cuadrícula",
        snapGrid: "Ajustar a la cuadrícula",
        visualization: "Visualización"
    },
    
    // Favorites system
    favorites: {
        title: "Favoritos",
        noFavorites: "No hay favoritos guardados. Guarda una configuración para encontrarla aquí.",
        save: "Guardar configuración",
        name: "Nombre del favorito",
        namePlaceholder: "Nombre del favorito (opcional)",
        description: "Descripción",
        descriptionPlaceholder: "Descripción (opcional)",
        defaultName: "Configuración guardada",
        saveButton: "Guardar",
        cancelButton: "Cancelar",
        deleteButton: "Eliminar",
        editButton: "Editar",
        sortBy: "Ordenar por",
        sortDate: "Fecha",
        sortName: "Nombre",
        sortSize: "Tamaño",
        sortModified: "Modificado",
        creationDate: "Creación:",
        lastModified: "Última modificación:",
        dates: "Fechas",
        dimensions: "Dimensiones:",
        surfaceArea: "Superficie:",
        load: "Cargar",
        deleteConfirm: "Confirmar eliminación",
        warning: "Advertencia",
        confirmModification: "Aplicar modificación",
        deleteWarning: "¿Está seguro de que desea eliminar esta configuración? Esta acción no se puede deshacer.",
        itemTitle: "Título"
    },
    
    // Summary and information
    summary: {
        title: "Resumen",
        currentConfig: "Configuración actual",
        copyInfo: "Copiar",
        copied: "¡Copiado!"
    },
    
    // Alignement et positionnement
    alignment: {
        title: "Posicionamiento del Área",
        center: "Centro",
        left: "Izquierda",
        right: "Derecha",
        top: "Arriba",
        bottom: "Abajo",
        topLeft: "Arriba-Izquierda",
        topRight: "Arriba-Derecha",
        bottomLeft: "Abajo-Izquierda",
        bottomRight: "Abajo-Derecha"
    },
    
    // General messages
    messages: {
        confirmDelete: "¿Estás seguro de que quieres eliminar este favorito?",
        yes: "Sí",
        no: "No",
        somethingWrong: "Algo salió mal.",
        noConnection: "Estás sin conexión, pero Osu!rea sigue funcionando.",
        offlineFeature: "Esta función requiere conexión a internet."
    },
    
    // Language and linguistic settings
    language: {
        title: "Idioma",
        fr: "Français",
        en: "English",
        es: "Español",
        autoDetect: "Detectar idioma automáticamente"
    },
    
    // Pied de page
    footer: {
        credit: "Diseñado para la comunidad de osu! por Yuzuctus",
        description: "Usa esta herramienta para visualizar y guardar el área activa de tu tableta gráfica.",
        tabletSettings: "Configuración de Tableta",
        spreadsheets: "Hojas de cálculo",
        otherProjects: "Otros proyectos"
    },
    
    // Messages de notification
    notifications: {
        favoriteNotFound: "Favorito no encontrado",
        configurationLoaded: "Configuración cargada",
        errorLoadingConfig: "Error al cargar la configuración",
        editModeActivated: "Modo de edición activado - Modifique los parámetros y luego haga clic en \"Aplicar modificación\"",
        editModeCanceled: "Modo de edición cancelado",
        favoriteDeleted: "Favorito eliminado",
        errorDeletingFavorite: "Error al eliminar el favorito",
        configurationUpdated: "Configuración actualizada",
        errorUpdatingConfig: "Error al actualizar la configuración",
        titleTruncated: "El título ha sido truncado a 32 caracteres",
        descriptionTruncated: "La descripción ha sido truncada a 144 caracteres",
        configurationSaved: "Configuración guardada",
        errorSavingConfig: "Error al guardar la configuración",
        areaPositionCenter: "Área activa posicionada en el centro",
        areaPositionLeft: "Área activa posicionada a la izquierda",
        areaPositionRight: "Área activa posicionada a la derecha",
        areaPositionTop: "Área activa posicionada arriba",
        areaPositionBottom: "Área activa posicionada abajo",
        areaPositionTopLeft: "Área activa posicionada arriba a la izquierda",
        areaPositionTopRight: "Área activa posicionada arriba a la derecha",
        areaPositionBottomLeft: "Área activa posicionada abajo a la izquierda",
        areaPositionBottomRight: "Área activa posicionada abajo a la derecha",
        copiedInfo: "¡Información copiada!",
        copyError: "Error al copiar la información",
        invalidDimensions: "Dimensiones inválidas para la alineación",
        tabletDataError: "Error al cargar los datos de la tableta",
        errorSavingPreferences: "No se pudieron guardar las preferencias",
        preferencesReset: "Preferencias restablecidas"
    }
};

export default es;
