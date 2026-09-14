import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname, sep } from "node:path";
const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".json": "application/json",
};
export function serve(port = 0) {
  return new Promise((resolveServer) => {
    const server = createServer(async (req, res) => {
      try {
        const pathname = decodeURIComponent(
          new URL(req.url, "http://localhost").pathname,
        );
        let file = resolve(root, "." + pathname);
        if (file !== root && !file.startsWith(root + sep))
          throw new Error("Outside root");
        let info;
        try {
          info = await stat(file);
        } catch {
          file += ".html";
          info = await stat(file);
        }
        if (info.isDirectory()) file = resolve(file, "index.html");
        const data = await readFile(file);
        res.writeHead(200, {
          "Content-Type":
            types[extname(file).toLowerCase()] || "application/octet-stream",
        });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
    });
    server.listen(port, "127.0.0.1", () => resolveServer(server));
  });
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const server = await serve(Number(process.env.PORT || 4173));
  console.log(`Preview: http://127.0.0.1:${server.address().port}`);
}
