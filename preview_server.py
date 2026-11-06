import http.server
import socketserver
import os
import re
import mimetypes
import sys

PORT = 9000
ALLJUNK_DIR = r"C:\Users\Administrator\.gemini\antigravity\scratch\alljunk"
NETLIFY_REF_DIR = r"C:\Users\Administrator\.gemini\antigravity\scratch\reference-netlify"

mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("video/mp4", ".mp4")
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/javascript", ".js")

def render_landing():
    landing_path = os.path.join(ALLJUNK_DIR, "landing.region")
    blocks_dir = os.path.join(ALLJUNK_DIR, "blocks")

    with open(landing_path, "r", encoding="utf-8") as f:
        html = f.read()

    def apply_blocks(match):
        block_name = match.group(1).strip()
        block_file = os.path.join(blocks_dir, block_name)
        if os.path.exists(block_file):
            with open(block_file, "r", encoding="utf-8") as bf:
                return bf.read()
        return f"<!-- Missing block: {block_name} -->"

    compiled = re.sub(r'\{@\|apply\s+([^}]+)\}', apply_blocks, html)
    compiled = compiled.replace("{squarespace-headers}", '<title>Rubbish Removal Bromley & South East London | All Junk Solutions</title>')
    compiled = compiled.replace("{squarespace-footers}", "")
    compiled = compiled.replace('<squarespace:block-field id="landing-custom-blocks" columns="12" />', "")
    compiled = compiled.replace('{squarespace.main-content}', "")
    compiled = compiled.replace('{squarespace.page-id}', 'alljunk-home')
    compiled = compiled.replace('{squarespace.page-classes}', 'homepage')
    return compiled.encode("utf-8")

def get_location_page(slug):
    loc_path = os.path.join(NETLIFY_REF_DIR, slug, "index.html")
    if os.path.exists(loc_path):
        with open(loc_path, "r", encoding="utf-8") as f:
            content = f.read()
        # Ensure asset paths point to /assets/
        content = content.replace('href="assets/', 'href="/assets/')
        content = content.replace('src="assets/', 'src="/assets/')
        return content.encode("utf-8")
    return None

class AllJunkHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        clean_path = self.path.split("?")[0].split("#")[0]
        
        # Homepage
        if clean_path in ["/", "/index.html", "/home"]:
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            content = render_landing()
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return

        # Location pages
        for loc in ["rubbish-removal-bromley", "rubbish-removal-kent", "rubbish-removal-south-east-london"]:
            if clean_path in [f"/{loc}", f"/{loc}/", f"/{loc}/index.html"]:
                loc_content = get_location_page(loc)
                if loc_content:
                    self.send_response(200)
                    self.send_header("Content-Type", "text/html; charset=utf-8")
                    self.send_header("Content-Length", str(len(loc_content)))
                    self.end_headers()
                    self.wfile.write(loc_content)
                    return

        # Assets
        if clean_path.startswith("/assets/"):
            rel_asset = clean_path[len("/assets/"):]
            asset_file = os.path.join(ALLJUNK_DIR, "assets", rel_asset)
            if os.path.exists(asset_file) and os.path.isfile(asset_file):
                mime, _ = mimetypes.guess_type(asset_file)
                size = os.path.getsize(asset_file)
                self.send_response(200)
                self.send_header("Content-Type", mime or "application/octet-stream")
                self.send_header("Content-Length", str(size))
                self.send_header("Cache-Control", "no-cache")
                self.end_headers()
                with open(asset_file, "rb") as af:
                    self.wfile.write(af.read())
                return

        # Scripts
        if clean_path.startswith("/scripts/"):
            rel_script = clean_path[len("/scripts/"):]
            script_file = os.path.join(ALLJUNK_DIR, "scripts", rel_script)
            if os.path.exists(script_file) and os.path.isfile(script_file):
                self.send_response(200)
                self.send_header("Content-Type", "application/javascript")
                self.send_header("Content-Length", str(os.path.getsize(script_file)))
                self.end_headers()
                with open(script_file, "rb") as sf:
                    self.wfile.write(sf.read())
                return

        # Fallback 404
        self.send_response(404)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(f"Not found: {self.path}".encode("utf-8"))

    def log_message(self, format, *args):
        # suppress noisy terminal logs
        pass

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), AllJunkHandler) as httpd:
        print(f"All Junk Local Preview Server running at http://localhost:{PORT}/")
        httpd.serve_forever()
