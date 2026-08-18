import os
import sys
import logging
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.converter import DocumentConverter, SUPPORTED_EXTENSIONS
from app.utils import (
    get_suggested_paths,
    validate_and_prepare_directory,
    save_markdown_file,
    create_zip_archive
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("markitdown_app")

app = FastAPI(
    title="MarkItDown Converter Studio",
    description="Conversor universal de documentos (Excel, Word, PDF, PPTX, etc.) a Markdown con Microsoft MarkItDown",
    version="1.0.0"
)

# Enable CORS for local integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instantiate document converter
converter = DocumentConverter()

# Request Models
class SaveFileItem(BaseModel):
    filename: str
    content: str

class SaveLocalRequest(BaseModel):
    directory_path: str
    files: List[SaveFileItem]
    overwrite: bool = True

class ValidatePathRequest(BaseModel):
    directory_path: str

class DownloadZipRequest(BaseModel):
    files: List[SaveFileItem]
    zip_name: Optional[str] = "markitdown_export.zip"

# API Endpoints
@app.get("/api/info")
async def get_info():
    """Returns application metadata, supported file types and suggested directory paths."""
    return {
        "title": "MarkItDown Converter Studio",
        "engine": "Microsoft MarkItDown",
        "supported_extensions": SUPPORTED_EXTENSIONS,
        "suggested_paths": get_suggested_paths()
    }

@app.post("/api/validate-path")
async def validate_path(req: ValidatePathRequest):
    """Validates if a target local directory exists or can be created with write permissions."""
    result = validate_and_prepare_directory(req.directory_path, create_if_missing=False)
    return result

@app.post("/api/convert")
async def convert_files(files: List[UploadFile] = File(...)):
    """Accepts multiple uploaded files and converts each to Markdown."""
    if not files:
        raise HTTPException(status_code=400, detail="No se recibieron archivos para convertir.")

    results = []
    for file in files:
        try:
            content_bytes = await file.read()
            res = converter.convert_bytes(content_bytes, file.filename)
            results.append(res)
        except Exception as e:
            logger.error(f"Error processing file {file.filename}: {str(e)}")
            results.append({
                "success": False,
                "filename": file.filename,
                "error": f"Error inesperado al procesar: {str(e)}"
            })
            
    return {
        "total": len(files),
        "successful": sum(1 for r in results if r.get("success")),
        "results": results
    }

@app.post("/api/save-local")
async def save_to_local_directory(req: SaveLocalRequest):
    """Saves generated markdown files directly into the specified local folder path."""
    if not req.files:
        raise HTTPException(status_code=400, detail="No hay archivos para guardar.")

    val = validate_and_prepare_directory(req.directory_path, create_if_missing=True)
    if not val["valid"]:
        return JSONResponse(status_code=400, content={"success": False, "error": val["message"]})

    saved_results = []
    for item in req.files:
        save_res = save_markdown_file(
            directory_path=val["resolved_path"],
            filename=item.filename,
            content=item.content,
            overwrite=req.overwrite
        )
        saved_results.append(save_res)

    all_success = all(r.get("success", False) for r in saved_results)
    return {
        "success": all_success,
        "directory": val["resolved_path"],
        "total_saved": sum(1 for r in saved_results if r.get("success")),
        "details": saved_results
    }

@app.post("/api/download-zip")
async def download_as_zip(req: DownloadZipRequest):
    """Creates a zip file containing all converted markdown files and returns as a download stream."""
    if not req.files:
        raise HTTPException(status_code=400, detail="No hay archivos para empaquetar.")

    files_data = [{"filename": item.filename, "content": item.content} for item in req.files]
    zip_buffer = create_zip_archive(files_data)
    
    zip_name = req.zip_name or "documentos_markdown.zip"
    if not zip_name.endswith(".zip"):
        zip_name += ".zip"

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{zip_name}"'}
    )

# Static Files & Frontend SPA
static_dir = Path(__file__).resolve().parent.parent / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

@app.get("/")
async def serve_index():
    index_file = static_dir / "index.html"
    if index_file.exists():
        return HTMLResponse(content=index_file.read_text(encoding="utf-8"))
    return HTMLResponse(content="<h1>MarkItDown Studio: Frontend en construcción</h1>")
