@echo off
title MarkItDown Studio
chcp 65001 >nul
cls

echo ============================================================
echo        MarkItDown Studio - Conversor de Documentos
echo ============================================================
echo.

cd /d "%~dp0"

IF NOT EXIST "venv\Scripts\activate.bat" (
    echo [INFO] Creando entorno virtual Python (venv)...
    python -m venv venv
    IF %ERRORLEVEL% NEQ 0 (
        echo [ERROR] No se pudo crear el entorno virtual. Asegurate de tener Python instalado.
        pause
        exit /b 1
    )
    echo [INFO] Instalando dependencias necesarias...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
) ELSE (
    call venv\Scripts\activate.bat
)

echo [INFO] Iniciando aplicacion y abriendo interfaz web...
python run.py

pause
