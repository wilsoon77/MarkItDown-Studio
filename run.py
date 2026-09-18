"""
MarkItDown Studio - Application Launcher
"""
import os
import threading
import time
import urllib.request
import webbrowser
import uvicorn

TARGET_URL = "http://127.0.0.1:8000"

def open_browser_when_ready():
    """
    Verifica periódicamente que el servidor FastAPI esté respondiendo
    y abre la interfaz en el navegador tan pronto como esté 100% disponible.
    """
    max_attempts = 40  # hasta 12 segundos de espera
    for _ in range(max_attempts):
        try:
            with urllib.request.urlopen(f"{TARGET_URL}/api/info", timeout=1) as resp:
                if resp.status == 200:
                    break
        except Exception:
            time.sleep(0.3)
            
    print(f"\n[INFO] Servidor activo. Abriendo navegador en {TARGET_URL}...\n")
    try:
        opened = webbrowser.open(TARGET_URL)
        if not opened:
            os.system(f'start {TARGET_URL}')
    except Exception:
        os.system(f'start {TARGET_URL}')

if __name__ == "__main__":
    print("=" * 60)
    print("  Iniciando MarkItDown Studio (Microsoft MarkItDown)")
    print(f"  Servidor en: {TARGET_URL}")
    print("=" * 60)
    
    # Launch browser automatically once server is confirmed listening
    threading.Thread(target=open_browser_when_ready, daemon=True).start()
    
    # Start FastAPI / Uvicorn server
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=False)
