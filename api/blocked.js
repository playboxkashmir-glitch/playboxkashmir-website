// Vercel Serverless Function: generic 404 responder.
// Used by vercel.json rewrites to prevent direct public access to internal
// source files (e.g. /lib, /db, /scripts, package.json) that must remain in
// the deployment for build purposes but should not be served over HTTP.
export default function handler(req, res) {
  res.status(404).json({ error: { code: 'not_found', message: 'The requested API endpoint was not found.' } });
  }
  
