import http.server
import socketserver
import os
import re
import mimetypes

PORT = 9000
ALLJUNK_DIR = r"C:\Users\Administrator\.gemini\antigravity\scratch\alljunk"

mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("video/mp4", ".mp4")
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("application/javascript", ".js")

PAGE_ROUTES = {
    "/": ("alljunk-landing-content.block", "Rubbish Removal Bromley, Kent & SE London | All Junk Solutions", "Licensed rubbish removal, house clearances and shed demolition in Bromley, Kent & SE London. Send photos on WhatsApp to 07931 935 833 for a fast quote."),
    "/home": ("alljunk-landing-content.block", "Rubbish Removal Bromley, Kent & SE London | All Junk Solutions", "Licensed rubbish removal, house clearances and shed demolition in Bromley, Kent & SE London. Send photos on WhatsApp to 07931 935 833 for a fast quote."),
    "/services": ("alljunk-services-page.block", "Waste & Rubbish Removal Services Bromley | All Junk Solutions", "House clearances, garage & shed demolition, furniture disposal, garden waste and builders waste across Bromley, Kent & SE London. Licensed CBDU195530."),
    "/pricing": ("alljunk-pricing-page.block", "Rubbish Removal Prices Bromley & Kent | All Junk Solutions", "Clear rubbish removal load prices from £125 to £425 (minimum charge from £40). Loading, sweep-up, parking and congestion included. Fast WhatsApp quotes."),
    "/testimonials": ("alljunk-reviews-page.block", "Customer Reviews | 5.0★ Rubbish Removal Bromley | All Junk", "Read 90+ 5.0-star customer reviews for All Junk Solutions across Bromley, Kent and South East London. Fast arrivals, fair photo quotes and tidy clearances."),
    "/reviews": ("alljunk-reviews-page.block", "Customer Reviews | 5.0★ Rubbish Removal Bromley | All Junk", "Read 90+ 5.0-star customer reviews for All Junk Solutions across Bromley, Kent and South East London. Fast arrivals, fair photo quotes and tidy clearances."),
    "/media": ("alljunk-media-page.block", "Before & After Clearances & Shed Demolition | All Junk", "See real before-and-after house clearances, garden waste collections and garage & shed demolitions across Bromley, Kent and South East London."),
    "/about-us": ("alljunk-about-page.block", "Areas Covered: Bromley, Kent & SE London | All Junk Solutions", "Bromley-based licensed waste carrier (CBDU195530) serving Bromley, Beckenham, Orpington, Chislehurst, Kent and South East London since 2017."),
    "/contact": ("alljunk-contact-page.block", "Contact & Fast WhatsApp Quote | All Junk Solutions Bromley", "Send photos of your rubbish and your postcode on WhatsApp to 07931 935 833 for a fast, fixed-price clearance quote across Bromley, Kent & SE London."),
    "/rubbish-removal-bromley": ("alljunk-about-page.block", "Rubbish Removal Bromley | Licensed Local Waste Collection", "Licensed rubbish removal in Bromley, Beckenham, Orpington and Chislehurst for homes, gardens, garages and building waste."),
    "/rubbish-removal-kent": ("alljunk-about-page.block", "Rubbish Removal Kent | Licensed Waste & House Clearance", "Licensed rubbish removal and house clearance across North West Kent, Orpington, Sevenoaks, Dartford and Sidcup."),
    "/rubbish-removal-south-east-london": ("alljunk-about-page.block", "Rubbish Removal South East London | Skip Alternative | All Junk", "Wait-and-load rubbish removal across South East London (Lewisham, Greenwich, Bexley, Catford, Eltham)."),
}

def render_page(route_path):
    block_name, title, desc = PAGE_ROUTES[route_path]
    landing_path = os.path.join(ALLJUNK_DIR, "landing.region")
    blocks_dir = os.path.join(ALLJUNK_DIR, "blocks")

    with open(landing_path, "r", encoding="utf-8") as f:
        html = f.read()

    html = html.replace("{@|apply alljunk-landing-content.block}", f"{{@|apply {block_name}}}")

    def apply_blocks(match):
        bname = match.group(1).strip()
        bfile = os.path.join(blocks_dir, bname)
        if os.path.exists(bfile):
            with open(bfile, "r", encoding="utf-8") as bf:
                return bf.read()
        return f"<!-- Missing block: {bname} -->"

    compiled = html
    for _ in range(6):
        if "{@|apply" not in compiled:
            break
        compiled = re.sub(r'\{@\|apply\s+([^}]+)\}', apply_blocks, compiled)

    compiled = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', compiled, flags=re.S)
    compiled = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{desc}">', compiled)
    compiled = compiled.replace("{squarespace-headers}", "")
    compiled = compiled.replace("{squarespace-footers}", "")
    compiled = compiled.replace('{squarespace.main-content}', "")
    compiled = compiled.replace('{squarespace.page-id}', 'alljunk-page')
    compiled = compiled.replace('{squarespace.page-classes}', 'multipage')
    return compiled.encode("utf-8")

class AllJunkHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        clean_path = self.path.split("?")[0].split("#")[0].rstrip("/") or "/"
        if clean_path == "/index.html":
            clean_path = "/"

        if clean_path in PAGE_ROUTES:
            content = render_page(clean_path)
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            return

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

        self.send_response(404)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(f"Not found: {self.path}".encode("utf-8"))

    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), AllJunkHandler) as httpd:
        print(f"All Junk Local Preview Server running at http://localhost:{PORT}/")
        httpd.serve_forever()
