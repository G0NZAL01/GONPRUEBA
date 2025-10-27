@echo off
REM Eliminar archivos del USB
del %~d0\keylogger.exe
del %~d0\autorun.inf
del %~d0\log.txt

echo Limpieza completada
pause