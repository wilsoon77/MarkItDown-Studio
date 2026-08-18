# 📄 MarkItDown Studio

Una aplicación web moderna, rápida y limpia impulsada por **Microsoft MarkItDown** para convertir tus documentos (**Excel, Word, PDF, PowerPoint, CSV, HTML, TXT, etc.**) a formato **Markdown** limpio y estructurado.

---

## ✨ Características

- 🎯 **Motor Oficial de Microsoft**: Utiliza la biblioteca oficial `markitdown` de Microsoft para extraer texto, títulos, jerarquías y tablas sin pérdida de formato.
- 📊 **Soporte de Formatos Principales**:
  - 📑 **PDF** (`.pdf`) - Extracción de texto y estructura.
  - 📝 **Microsoft Word** (`.docx`, `.doc`) - Encabezados, tablas, listas y formato.
  - 📊 **Microsoft Excel** (`.xlsx`, `.xls`) - Conversión de hojas y celdas a tablas Markdown estándar.
  - 📽️ **Microsoft PowerPoint** (`.pptx`) - Extracción de contenido de diapositivas.
  - 🌐 **Web y Datos** (`.csv`, `.html`, `.json`, `.xml`, `.txt`).
- ⚡ **Interfaz Web Intuitiva y Moderna**:
  - Zona **Drag & Drop** para arrastrar y soltar múltiples archivos a la vez.
  - Cola de procesamiento con estados en vivo y progreso.
  - Pestaña de **Vista Previa Renderizada** con soporte visual de tablas, títulos y bloques de código con resaltado sintáctico.
  - Pestaña de **Markdown Fuente (.md)** con edición rápida y estadísticas (caracteres, palabras, líneas y tiempo transcurrido).
- 💾 **Opciones de Guardado y Exportación**:
  - **Guardado directo en ruta local**: Elige cualquier ruta de tu disco (ej: `C:\Users\tu_usuario\Documentos\MD_Salidas`) y el sistema creará la carpeta y guardará los archivos directamente en tu computadora.
  - **Descarga directa en navegador** de archivos `.md` individuales.
  - **Empaquetado en .ZIP** para descargar todos los archivos convertidos en un solo clic.
  - **Copia instantánea al portapapeles** con un clic.
- 🌓 **Tema Oscuro y Claro** con guardado de preferencias.

---

## 🚀 Inicio Rápido

### En Windows (Recomendado)
Simplemente haz doble clic en el archivo:
```bat
start.bat
```
El script creará el entorno virtual si no existe, instalará las librerías necesarias y abrirá automáticamente tu navegador en `http://127.0.0.1:8000`.

### Desde la Terminal / PowerShell
```powershell
# 1. Crear y activar entorno virtual
python -m venv venv
.\venv\Scripts\activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Iniciar el servidor
python run.py
```

Abre tu navegador en `http://localhost:8000`.

---

## 📁 Estructura del Proyecto

```
markitdown-project/
├── app/
│   ├── __init__.py
│   ├── main.py              # Backend FastAPI (endpoints REST de conversión y guardado)
│   ├── converter.py         # Integración y lógica del motor Microsoft MarkItDown
│   └── utils.py             # Funciones de guardado en disco, rutas y ZIP
├── static/
│   ├── index.html           # Interfaz de usuario SPA limpia y responsiva
│   ├── css/
│   │   └── style.css        # Estilos modernos con variables CSS (Dark/Light)
│   └── js/
│       └── app.js           # Lógica frontend: Drag & Drop, Marked.js, API calls
├── requirements.txt         # Dependencias del proyecto
├── run.py                   # Script de lanzamiento con auto-apertura de navegador
├── start.bat                # Lanzador directo para Windows
└── README.md                # Documentación del proyecto
```

---

## 🔌 Endpoints de la API

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/` | Carga la interfaz web SPA |
| `GET` | `/api/info` | Información del motor, formatos soportados y rutas sugeridas |
| `POST` | `/api/convert` | Convierte uno o múltiples archivos subidos (`multipart/form-data`) a Markdown |
| `POST` | `/api/save-local` | Guarda archivos `.md` en una ruta del sistema de archivos local |
| `POST` | `/api/validate-path` | Comprueba si un directorio local existe o tiene permisos de escritura |
| `POST` | `/api/download-zip` | Genera y descarga un archivo `.zip` con todos los `.md` generados |
