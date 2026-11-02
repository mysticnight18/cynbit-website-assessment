const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const STORE = path.join(ROOT, 'data', 'inquiries.json');
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.json':'application/json; charset=utf-8' };
const rate = new Map();

function send(res, status, body, type='application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options':'nosniff', 'Referrer-Policy':'strict-origin-when-cross-origin', 'X-Frame-Options':'DENY', 'Cache-Control': type.includes('html') ? 'no-cache' : 'public, max-age=3600' });
  res.end(Buffer.isBuffer(body) ? body : (typeof body === 'string' ? body : JSON.stringify(body)));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '', tooLarge = false; req.on('data', chunk => { if (tooLarge) return; body += chunk; if (body.length > 12000) { tooLarge = true; body = ''; } });
    req.on('end', () => { if (tooLarge) return reject(new Error('too_large')); try { resolve(JSON.parse(body || '{}')); } catch { reject(new Error('invalid_json')); } });
    req.on('error', reject);
  });
}
function clean(value, max) { return typeof value === 'string' ? value.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0,max) : ''; }
async function saveInquiry(data) {
  await fs.mkdir(path.dirname(STORE), { recursive: true });
  let entries = [];
  try { entries = JSON.parse(await fs.readFile(STORE, 'utf8')); if (!Array.isArray(entries)) entries = []; } catch (e) { if (e.code !== 'ENOENT') throw e; }
  entries.push(data);
  await fs.writeFile(STORE, JSON.stringify(entries, null, 2) + '\n', { mode: 0o600 });
}
const pages = { '/':'index.html', '/privacy':'privacy.html', '/terms':'terms.html' };

const server = http.createServer(async (req,res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET' && url.pathname === '/api/health') return send(res,200,{ status:'ok' });
  if (req.method === 'POST' && url.pathname === '/api/inquiries') {
    const now = Date.now(), key = req.socket.remoteAddress || 'unknown', previous = rate.get(key) || [];
    const recent = previous.filter(time => now - time < 10 * 60 * 1000);
    if (recent.length >= 5) return send(res,429,{ error:'Please wait a few minutes before sending another inquiry.' });
    rate.set(key,[...recent,now]);
    try {
      const input = await readBody(req);
      if (input.website) return send(res,200,{ ok:true });
      const inquiry = {
        id: crypto.randomUUID(), createdAt: new Date().toISOString(),
        name: clean(input.name,100), email: clean(input.email,254).toLowerCase(),
        company: clean(input.company,120), service: clean(input.service,80),
        message: clean(input.message,3000), consent: input.consent === true
      };
      if (inquiry.name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiry.email) || inquiry.message.length < 20 || !inquiry.consent) {
        return send(res,400,{ error:'Add a valid name and email, describe your project in at least 20 characters, and agree to the privacy notice.' });
      }
      await saveInquiry(inquiry);
      return send(res,201,{ ok:true, message:'Your note is with us. We’ll be in touch using the email you provided.' });
    } catch (e) {
      if (e.message === 'too_large') return send(res,413,{ error:'Your message is too large. Please shorten it and try again.' });
      if (e.message === 'invalid_json') return send(res,400,{ error:'The request could not be read. Please try again.' });
      console.error('Inquiry storage error:',e.message); return send(res,500,{ error:'We could not save your note just now. Please try again shortly.' });
    }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res,405,{ error:'Method not allowed.' });
  let file = pages[url.pathname];
  if (!file && /^\/(styles\.css|app\.js|favicon\.svg)$/.test(url.pathname)) file = url.pathname.slice(1);
  if (!file) return send(res,404,'<!doctype html><title>Not found</title><h1>Page not found</h1><a href="/">Return home</a>','text/html; charset=utf-8');
  try { const content = await fs.readFile(path.join(ROOT,file)); send(res,200,content,MIME[path.extname(file)]); }
  catch { send(res,500,'Unable to load this page.','text/plain; charset=utf-8'); }
});

server.listen(PORT, '127.0.0.1', () => console.log(`Cynbit site running at http://localhost:${PORT}`));
