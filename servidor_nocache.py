#!/usr/bin/env python3
import http.server, socketserver, os

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "03 de Junio de 2026", "11 de junio v1")
PORT = 8080

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE, **kwargs)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()
    def log_message(self, format, *args):
        print(f"  {args[0]} {args[1]}")

with socketserver.TCPServer(('127.0.0.1', PORT), NoCacheHandler) as httpd:
    print(f"\n Servidor SIN CACHE en: http://localhost:{PORT}/GestorUrbano_M06_1.html")
    print(" Presiona Ctrl+C para detener\n")
    httpd.serve_forever()
