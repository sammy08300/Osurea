const es = {
    // Informations générales de l'application
    app: {
        title: "Visualizador de Área",
        description: "Visualizador de área para jugadores de osu! que usan tableta gráfica. Configura y visualiza tu área activa con precisión, guarda tus configuraciones como favoritos y compártelas."
    },
    
    // Paramètres de la tablette
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
    
    // Système de favoris
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
        dimensions: "Dimensiones:",
        surfaceArea: "Superficie:",
        load: "Cargar",
        deleteConfirm: "Confirmar eliminación",
        warning: "Advertencia",
        confirmModification: "Aplicar modificación",
        deleteWarning: "¿Está seguro de que desea eliminar esta configuración? Esta acción no se puede deshacer.",
        itemTitle: "Título"
    },
    
    // Résumé et informations
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
    
    // Messages généraux
    messages: {
        confirmDelete: "¿Estás seguro de que quieres eliminar este favorito?",
        yes: "Sí",
        no: "No",
        somethingWrong: "Algo salió mal.",
        noConnection: "Estás sin conexión, pero Osu!rea sigue funcionando.",
        offlineFeature: "Esta función requiere conexión a internet."
    },
    
    // Langue et paramètres linguistiques
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
        copyError: "Error al copiar la información"
    }
};

export default es; 