const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  let file;
  try { file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
  catch { res.writeHead(400).end(); return; }
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (file === root || file.endsWith(path.sep)) file = path.join(file, 'index.html');
  fs.readFile(file, (err, data)=>{
    if (err) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'}).end(data);
  });
}).listen(8080, '0.0.0.0', ()=>console.log('Ballistic Arena: http://localhost:8080 (same Wi-Fi phone: http://YOUR-PC-IP:8080)'));
