@echo off
title Palmeras Gym HQ
cd /d "%~dp0"

:MENU
cls
echo ============================================
echo   Palmeras Gym HQ - Sistema de Gestion
echo ============================================
echo.
echo   [1] Iniciar servidor (con recarga automatica)
echo   [2] Iniciar servidor (produccion)
echo   [3] Salir
echo.
set /p opcion="Selecciona una opcion (1-3): "

if "%opcion%"=="1" goto DEV
if "%opcion%"=="2" goto PROD
if "%opcion%"=="3" exit /b
goto MENU

:DEV
cls
echo ============================================
echo   MODO DESARROLLO - Recarga automatica activa
echo ============================================
echo.
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo Error al instalar dependencias.
        pause
        exit /b 1
    )
)
echo.
echo Servidor iniciado en: http://localhost:3000
echo Abriendo navegador...
start http://localhost:3000
echo.
echo El servidor se reiniciara automaticamente al modificar
echo archivos .js, .html, .json o .css en esta carpeta.
echo.
echo Presiona Ctrl+C para detener.
echo.
call npx nodemon server.js --ext js,html,json,css --watch .
if errorlevel 1 (
    echo Error al iniciar el servidor.
    pause
)
exit /b

:PROD
cls
echo ============================================
echo   MODO PRODUCCION
echo ============================================
echo.
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
    if errorlevel 1 (
        pause
        exit /b 1
    )
)
echo.
echo Servidor iniciado en: http://localhost:3000
start http://localhost:3000
echo.
echo Presiona Ctrl+C para detener.
echo.
node server.js
if errorlevel 1 (
    pause
)
exit /b
