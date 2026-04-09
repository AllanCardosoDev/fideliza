import { createServer } from "http";
import { readFile } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const PORT = process.env.PORT || 3000;
const DIST = join(__dirname, "dist");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".map": "application/json",
};

createServer((req, res) => {
  // Remove query string
  const urlPath = req.url.split("?")[0];
  
  // Se for request da raiz, serve index.html
  if (urlPath === "/") {
    readFile(join(DIST, "index.html"), (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    });
    return;
  }
  
  // Tenta servir arquivo estático
  const filePath = join(DIST, urlPath);
  const ext = extname(filePath).toLowerCase();
  
  readFile(filePath, (err, data) => {
    if (err) {
      // Se arquivo não encontrado e é uma rota (sem extensão ou extensão de rota)
      // serve index.html para SPA routing
      const isAsset = /\.[a-zA-Z0-9]+$/.test(urlPath);
      
      if (isAsset) {
        // É um arquivo com extensão que não existe
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
        return;
      }
      
      // É uma rota SPA, serve index.html
      readFile(join(DIST, "index.html"), (err2, html) => {
        if (err2) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not found");
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
      });
      return;
    }
    
    // Arquivo encontrado, retorna com o MIME type correto
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
    });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`FidelizaCred rodando na porta ${PORT}`);
});
