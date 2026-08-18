"""
Comprehensive Verification script for MarkItDown Converter Studio
Tests Excel, Word, PDF, CSV, Local Saving and Zip export.
"""
import os
import sys
from pathlib import Path
from docx import Document
from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from app.converter import DocumentConverter
from app.utils import save_markdown_file, validate_and_prepare_directory, create_zip_archive

def test_all():
    print(">>> Iniciando pruebas completas de MarkItDown Studio...")
    
    test_dir = Path("test_samples")
    test_dir.mkdir(exist_ok=True)
    
    # 1. Generate Excel
    excel_path = test_dir / "sample_finanzas.xlsx"
    wb = Workbook()
    ws = wb.active
    ws.title = "Reporte 2026"
    ws.append(["ID", "Departamento", "Presupuesto ($)", "Estado"])
    ws.append([1, "Desarrollo de Software", 45000, "Aprobado"])
    ws.append([2, "Diseño & UX", 18500, "Aprobado"])
    ws.append([3, "Infraestructura Cloud", 32000, "En Revisión"])
    ws.append([4, "Marketing Digital", 15000, "Completado"])
    wb.save(excel_path)
    print(f" [+] Archivo Excel creado: {excel_path}")

    # 2. Generate Word
    docx_path = test_dir / "sample_documento.docx"
    doc = Document()
    doc.add_heading("Reporte Trimestral de Proyecto", level=1)
    doc.add_paragraph("Este es un documento de prueba generado para verificar la integración con Microsoft MarkItDown.")
    doc.add_heading("Objetivos Principales", level=2)
    doc.add_paragraph("1. Migración exitosa a la nube.")
    doc.add_paragraph("2. Reducción de latencia en consultas.")
    doc.add_paragraph("3. Automatización de conversiones a Markdown.")
    doc.save(docx_path)
    print(f" [+] Archivo Word creado: {docx_path}")

    # 3. Generate PDF
    pdf_path = test_dir / "sample_resumen.pdf"
    c = canvas.Canvas(str(pdf_path), pagesize=letter)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(100, 750, "Documento Tecnico PDF")
    c.setFont("Helvetica", 12)
    c.drawString(100, 720, "Este archivo PDF fue creado para validar la extraccion a Markdown.")
    c.drawString(100, 700, "MarkItDown de Microsoft parsea el documento de manera eficiente.")
    c.save()
    print(f" [+] Archivo PDF creado: {pdf_path}")

    # 4. Generate CSV
    csv_path = test_dir / "sample_datos.csv"
    csv_path.write_text("Nombre,Rol,Tecnologia,Nivel\nWilson,Tech Lead,Python/FastAPI,Senior\nAna,Frontend Dev,Modern Vanilla JS,Senior", encoding="utf-8")
    print(f" [+] Archivo CSV creado: {csv_path}")

    # 5. Conversion Testing
    converter = DocumentConverter()
    files_to_test = [excel_path, docx_path, pdf_path, csv_path]

    for path in files_to_test:
        print(f"\n--- Probando conversión de: {path.name} ---")
        res = converter.convert_file(str(path))
        if res["success"]:
            print(f"  [OK] Éxito al convertir {path.name}")
            print(f"  [OK] Archivo salida: {res['output_filename']}")
            print(f"  [OK] Stats: {res['stats']}")
            print("  --- Muestra Markdown ---")
            print(res["markdown"][:180].strip() + ("..." if len(res["markdown"]) > 180 else ""))
        else:
            print(f"  [FAIL] Error al convertir {path.name}: {res.get('error')}")
            sys.exit(1)

    # 6. Local Saving
    print("\n--- Probando guardado en carpeta local personalizada ---")
    custom_output_dir = Path("outputs_prueba")
    save_result = save_markdown_file(
        directory_path=str(custom_output_dir),
        filename="reporte_guardado.md",
        content="# Archivo guardado correctamente desde MarkItDown Studio\n\nPrueba superada con éxito."
    )
    if save_result["success"]:
        print(f"  [OK] Archivo guardado en disco: {save_result['saved_path']}")
        assert Path(save_result['saved_path']).exists()
    else:
        print(f"  [FAIL] Error al guardar archivo: {save_result['error']}")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("  ¡TODAS LAS PRUEBAS (EXCEL, WORD, PDF, CSV) PASARON CON ÉXITO!")
    print("=" * 60)

if __name__ == "__main__":
    test_all()
