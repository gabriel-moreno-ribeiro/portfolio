import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email.' });
  }

  // TODO: revisar — connect to an email service (Resend, SendGrid, etc.)
  // For now, log and return success to unblock the form UX.
  // In production, wire this to Resend or store in a database.
  console.log('[Contact Form]', { name, email, message, timestamp: new Date().toISOString() });

  return res.status(200).json({ ok: true });
}
