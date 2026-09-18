@echo off
title MarkItDown Studio
chcp 65001 >nul
cls

echo ============================================================
echo        MarkItDown Studio - Conversor de Documentos
echo ============================================================
echo.

cd /d "%~dp0"

:: Verificar si el entorno virtual ya esta creado
if exist "venv\Scripts\python.exe" goto launch_server

echo [INFO] No se encontro el entorno virtual. Creando entorno venv...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python no esta disponible en el PATH del sistema.
    echo Por favor instala Python 3.10 o superior desde https://www.python.org/
    echo.
    pause
    exit /b 1
)

python -m venv venv
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] No se pudo crear el entorno virtual venv.
    echo.
    pause
    exit /b 1
)

echo [INFO] Instalando dependencias necesarias desde requirements.txt...
call "venv\Scripts\activate.bat"
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Ocurrio un error al instalar las dependencias.
    echo.
    pause
    exit /b 1
)

:launch_server
echo [INFO] Iniciando servidor y preparando la interfaz web...
echo [INFO] URL: http://127.0.0.1:8000
echo.
echo Presiona CTRL + C en esta ventana para detener el servidor cuando desees.
echo ============================================================
echo.

"venv\Scripts\python.exe" run.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] El servidor se detuvo con un error.
    pause
)
