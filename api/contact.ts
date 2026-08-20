import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Contact service is not configured.' });
  }

  const { name, email, message } = req.body || {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }
  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    return res.status(400).json({ error: 'Message must be at least 10 characters.' });
  }

  const sanitizedName = name.trim().slice(0, 200);
  const sanitizedEmail = email.trim().slice(0, 254);
  const sanitizedMessage = message.trim().slice(0, 5000);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Portfolio Contact <contact@gabrielmr.com>',
        to: ['me@gabrielmr.com'],
        reply_to: sanitizedEmail,
        subject: `[Portfolio] Message from ${sanitizedName}`,
        text: [
          `Name: ${sanitizedName}`,
          `Email: ${sanitizedEmail}`,
          ``,
          `Message:`,
          sanitizedMessage,
        ].join('\n'),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('[Contact] Resend error:', response.status, body);
      return res.status(502).json({ error: 'Failed to send message. Please try again.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[Contact] Network error:', err);
    return res.status(502).json({ error: 'Failed to send message. Please try again.' });
  }
}
