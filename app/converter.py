import os
import sys
import tempfile
import time
import logging
from pathlib import Path
from typing import Dict, Any, Optional

from markitdown import MarkItDown
from app.utils import get_markdown_filename, format_file_size

logger = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {
    ".pdf": {"type": "PDF", "icon": "fa-file-pdf", "category": "Documento", "desc": "Documentos PDF"},
    ".docx": {"type": "Word", "icon": "fa-file-word", "category": "Documento", "desc": "Microsoft Word"},
    ".doc": {"type": "Word", "icon": "fa-file-word", "category": "Documento", "desc": "Microsoft Word heredado"},
    ".xlsx": {"type": "Excel", "icon": "fa-file-excel", "category": "Hoja de Cálculo", "desc": "Microsoft Excel"},
    ".xls": {"type": "Excel", "icon": "fa-file-excel", "category": "Hoja de Cálculo", "desc": "Microsoft Excel 97-2003"},
    ".pptx": {"type": "PowerPoint", "icon": "fa-file-powerpoint", "category": "Presentación", "desc": "Microsoft PowerPoint"},
    ".csv": {"type": "CSV", "icon": "fa-file-csv", "category": "Datos", "desc": "Valores separados por comas"},
    ".html": {"type": "HTML", "icon": "fa-file-code", "category": "Web", "desc": "Páginas Web HTML"},
    ".htm": {"type": "HTML", "icon": "fa-file-code", "category": "Web", "desc": "Páginas Web HTML"},
    ".txt": {"type": "Texto", "icon": "fa-file-alt", "category": "Texto", "desc": "Texto plano"},
    ".json": {"type": "JSON", "icon": "fa-file-code", "category": "Datos", "desc": "Estructuras JSON"},
    ".xml": {"type": "XML", "icon": "fa-file-code", "category": "Datos", "desc": "Estructuras XML"},
    ".png": {"type": "Imagen", "icon": "fa-file-image", "category": "Imagen", "desc": "Imagen PNG"},
    ".jpg": {"type": "Imagen", "icon": "fa-file-image", "category": "Imagen", "desc": "Imagen JPEG"},
    ".jpeg": {"type": "Imagen", "icon": "fa-file-image", "category": "Imagen", "desc": "Imagen JPEG"},
}

class DocumentConverter:
    def __init__(self):
        # Initialize MarkItDown engine
        self.md_engine = MarkItDown()
        logger.info("MarkItDown engine initialized successfully.")

    def convert_file(self, file_path: str, original_filename: Optional[str] = None) -> Dict[str, Any]:
        """Converts a local file path to markdown using MarkItDown."""
        start_time = time.time()
        path = Path(file_path)
        
        if not path.exists():
            return {
                "success": False,
                "error": f"Archivo no encontrado: {file_path}",
                "filename": original_filename or path.name
            }

        fname = original_filename or path.name
        suffix = Path(fname).suffix.lower()
        file_size = path.stat().st_size
        format_info = SUPPORTED_EXTENSIONS.get(suffix, {
            "type": suffix.replace(".", "").upper() or "Archivo",
            "icon": "fa-file",
            "category": "Desconocido",
            "desc": "Archivo genérico"
        })

        try:
            # Run MarkItDown conversion
            result = self.md_engine.convert(str(path))
            
            markdown_content = result.text_content if hasattr(result, "text_content") else str(result)
            title = getattr(result, "title", None) or Path(fname).stem
            
            elapsed_time = round(time.time() - start_time, 3)
            char_count = len(markdown_content)
            word_count = len(markdown_content.split())
            line_count = len(markdown_content.splitlines())

            return {
                "success": True,
                "filename": fname,
                "output_filename": get_markdown_filename(fname),
                "format_info": format_info,
                "original_size": file_size,
                "original_size_formatted": format_file_size(file_size),
                "title": title,
                "markdown": markdown_content,
                "stats": {
                    "chars": char_count,
                    "words": word_count,
                    "lines": line_count,
                    "time_seconds": elapsed_time
                }
            }
        except Exception as e:
            elapsed_time = round(time.time() - start_time, 3)
            logger.error(f"Error converting {fname}: {str(e)}", exc_info=True)
            return {
                "success": False,
                "filename": fname,
                "output_filename": get_markdown_filename(fname),
                "format_info": format_info,
                "original_size": file_size,
                "original_size_formatted": format_file_size(file_size),
                "error": f"Error en la conversión: {str(e)}",
                "stats": {
                    "time_seconds": elapsed_time
                }
            }

    def convert_bytes(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Saves bytes to a temporary file, executes conversion and cleans up."""
        suffix = Path(filename).suffix
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        try:
            res = self.convert_file(tmp_path, original_filename=filename)
            return res
        finally:
            try:
                os.remove(tmp_path)
            except Exception:
                pass
