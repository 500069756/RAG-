"""
Simple HTTP Server for Mutual Fund FAQ Assistant Frontend
Usage: python serve.py [--port PORT]
"""

import http.server
import socketserver
import argparse
import os
from urllib.parse import urlparse

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with CORS support"""
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        # Handle OPTIONS preflight requests
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        # Custom log format
        print(f"[{self.log_date_time_string()}] {format % args}")

def serve(port):
    """Start the HTTP server"""
    
    # Change to frontend directory
    frontend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(frontend_dir)
    
    # Create server
    with socketserver.TCPServer(("", port), CORSRequestHandler) as httpd:
        print("=" * 60)
        print("💼 Mutual Fund FAQ Assistant - Testing UI")
        print("=" * 60)
        print(f"🌐 Server running at: http://localhost:{port}")
        print(f"📁 Serving files from: {frontend_dir}")
        print(f"🔗 Backend API: http://localhost:5000/api")
        print("=" * 60)
        print("\n⚠️  Make sure the Flask backend is running on port 5000!")
        print("   Run: cd backend && python app.py\n")
        print("Press Ctrl+C to stop the server\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Server stopped.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Frontend HTTP Server')
    parser.add_argument('--port', type=int, default=3000, help='Port to serve on (default: 3000)')
    args = parser.parse_args()
    
    serve(args.port)
