@echo off
setlocal
set PORT=8765
cd /d "%~dp0"
echo.
echo Clienteling iPad - L'Oreal Luxe Mexico
echo ---------------------------------------
echo  - app.html                       vista app real (login + nav)  [SE ABRE]
echo  - Clienteling iPad App.html      vista design canvas (board)
echo  - LOREAL Luxe Clienteling.html   bundle standalone (sin server)
echo.
start "" "http://127.0.0.1:%PORT%/app.html"
where python >nul 2>nul && (python -m http.server %PORT% --bind 127.0.0.1 & goto :eof)
where py     >nul 2>nul && (py -3 -m http.server %PORT% --bind 127.0.0.1 & goto :eof)
echo Python no encontrado. Para correr la app necesitas Python.
echo Alternativa sin servidor: doble clic en "LOREAL Luxe Clienteling.html" (canvas).
pause
