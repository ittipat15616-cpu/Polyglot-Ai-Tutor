@echo off
setlocal
cd /d "%~dp0"
set "PORT=3000"
set "NODE_EXE=C:\Users\USER\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if not exist "%NODE_EXE%" (
  echo Bundled Node.js was not found:
  echo %NODE_EXE%
  echo.
  echo Falling back to system node.
  set "NODE_EXE=node"
)

echo Starting Polyglot AI Tutor on http://localhost:3000
echo Keep this window open while using the app.
echo.
"%NODE_EXE%" .\node_modules\tsx\dist\cli.mjs server.ts
echo.
echo Server stopped. Press any key to close this window.
pause >nul
