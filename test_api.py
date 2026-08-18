"""
API Integration tests for FastAPI endpoints in MarkItDown Studio
"""
from fastapi.testclient import TestClient
from pathlib import Path
from app.main import app

client = TestClient(app)

def test_api():
    print(">>> Iniciando pruebas de integración de la API REST...")

    # 1. Info endpoint
    res = client.get("/api/info")
    assert res.status_code == 200, f"Error en /api/info: {res.text}"
    data = res.json()
    assert "supported_extensions" in data
    assert "suggested_paths" in data
    print("  [OK] GET /api/info responde correctamente.")

    # 2. Path validation
    res = client.post("/api/validate-path", json={"directory_path": str(Path.cwd() / "outputs")})
    assert res.status_code == 200
    print("  [OK] POST /api/validate-path responde correctamente.")

    # 3. File upload & conversion
    excel_path = Path("test_samples/sample_finanzas.xlsx")
    with open(excel_path, "rb") as f:
        res = client.post("/api/convert", files={"files": ("sample_finanzas.xlsx", f, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")})
    assert res.status_code == 200
    data = res.json()
    assert data["successful"] == 1
    assert "Reporte 2026" in data["results"][0]["markdown"]
    print("  [OK] POST /api/convert procesó el archivo Excel exitosamente.")

    # 4. Save local
    res = client.post("/api/save-local", json={
        "directory_path": str(Path.cwd() / "outputs_api_test"),
        "files": [{"filename": "resultado_api.md", "content": "# Resultado generado vía API"}],
        "overwrite": True
    })
    assert res.status_code == 200
    save_data = res.json()
    assert save_data["success"] is True
    print("  [OK] POST /api/save-local guardó el archivo en disco.")

    # 5. Download ZIP
    res = client.post("/api/download-zip", json={
        "files": [
            {"filename": "doc1.md", "content": "# Doc 1"},
            {"filename": "doc2.md", "content": "# Doc 2"}
        ]
    })
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"
    print("  [OK] POST /api/download-zip generó el archivo ZIP correctamente.")

    # 6. Static / SPA endpoint
    res = client.get("/")
    assert res.status_code == 200
    assert "MarkItDown Studio" in res.text
    print("  [OK] GET / cargó el archivo index.html de la interfaz.")

    print("\n" + "=" * 60)
    print("  ¡TODAS LAS PRUEBAS DE LA API PASARON CON ÉXITO!")
    print("=" * 60)

if __name__ == "__main__":
    test_api()
