import os
import re
import io
import zipfile
from pathlib import Path
from typing import Dict, List, Any, Optional

def get_suggested_paths() -> List[Dict[str, str]]:
    """Returns a list of common Windows/system user directories as quick suggestions."""
    paths = []
    user_home = Path.home()
    
    candidates = [
        {"name": "Descargas (Downloads)", "path": user_home / "Downloads"},
        {"name": "Documentos (Documents)", "path": user_home / "Documents"},
        {"name": "Escritorio (Desktop)", "path": user_home / "Desktop"},
        {"name": "Carpeta del Proyecto", "path": Path.cwd() / "outputs"},
    ]
    
    for item in candidates:
        p = item["path"]
        paths.append({
            "name": item["name"],
            "path": str(p.resolve()),
            "exists": p.exists()
        })
    return paths

def sanitize_filename(name: str) -> str:
    """Sanitizes filename removing invalid characters."""
    # Remove invalid path characters for Windows / Linux
    clean = re.sub(r'[\\/*?:"<>|]', "_", name)
    clean = clean.strip()
    return clean or "document"

def get_markdown_filename(original_filename: str) -> str:
    """Returns filename with .md extension."""
    stem = Path(original_filename).stem
    clean_stem = sanitize_filename(stem)
    return f"{clean_stem}.md"

def format_file_size(size_in_bytes: int) -> str:
    """Formats bytes to human readable format."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_in_bytes < 1024.0:
            return f"{size_in_bytes:.1f} {unit}"
        size_in_bytes /= 1024.0
    return f"{size_in_bytes:.1f} TB"

def validate_and_prepare_directory(directory_path: str, create_if_missing: bool = True) -> Dict[str, Any]:
    """Validates if a directory path is valid and accessible."""
    if not directory_path or not directory_path.strip():
        return {"valid": False, "message": "La ruta no puede estar vacía."}
    
    try:
        path = Path(directory_path.strip()).expanduser().resolve()
        
        if not path.exists():
            if create_if_missing:
                path.mkdir(parents=True, exist_ok=True)
            else:
                return {"valid": False, "message": "El directorio especificado no existe."}
        
        if not path.is_dir():
            return {"valid": False, "message": "La ruta especificada no es un directorio."}
        
        # Test write permission by touching a temporary file
        test_file = path / ".tmp_test_write_perm"
        try:
            test_file.write_text("test", encoding="utf-8")
            test_file.unlink(missing_ok=True)
        except Exception as e:
            return {"valid": False, "message": f"No hay permisos de escritura en la ruta: {str(e)}"}
            
        return {
            "valid": True,
            "resolved_path": str(path),
            "message": "Directorio válido y accesible."
        }
    except Exception as e:
        return {"valid": False, "message": f"Ruta inválida: {str(e)}"}

def save_markdown_file(directory_path: str, filename: str, content: str, overwrite: bool = True) -> Dict[str, Any]:
    """Saves a markdown string to a local directory."""
    val = validate_and_prepare_directory(directory_path, create_if_missing=True)
    if not val["valid"]:
        return {"success": False, "error": val["message"]}
    
    target_dir = Path(val["resolved_path"])
    safe_name = sanitize_filename(filename)
    if not safe_name.lower().endswith(".md"):
        safe_name += ".md"
        
    target_file = target_dir / safe_name
    
    if target_file.exists() and not overwrite:
        # Generate unique name
        counter = 1
        stem = target_file.stem
        while target_file.exists():
            target_file = target_dir / f"{stem}_{counter}.md"
            counter += 1
            
    try:
        target_file.write_text(content, encoding="utf-8")
        return {
            "success": True,
            "saved_path": str(target_file.resolve()),
            "filename": target_file.name,
            "bytes_written": len(content.encode("utf-8"))
        }
    except Exception as e:
        return {"success": False, "error": f"Error al guardar archivo: {str(e)}"}

def create_zip_archive(files: List[Dict[str, str]]) -> io.BytesIO:
    """Creates an in-memory zip file from a list of dicts with 'filename' and 'content'."""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for f in files:
            fname = f.get("filename", "document.md")
            if not fname.endswith(".md"):
                fname += ".md"
            content = f.get("content", "")
            zip_file.writestr(fname, content.encode("utf-8"))
    zip_buffer.seek(0)
    return zip_buffer
