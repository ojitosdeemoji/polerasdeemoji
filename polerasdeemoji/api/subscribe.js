export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, nombre } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Correo no válido' });
  }

  const apiKey = process.env.RESEND_API_KEY || process.env.resend_api_key;
  if (!apiKey) {
    return res.status(500).json({ error: 'Falta la API Key en Vercel' });
  }

  try {
    // Apunta exactamente a tu audiencia "General" usando tu ID
    const response = await fetch('https://api.resend.com/audiences/1f6a0ca1-285f-4fae-9015-35efdc250845/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        email: email,
        first_name: nombre || 'Suscriptor',
        unsubscribed: false
      })
    });

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({ success: true, data });
    } else {
      return res.status(response.status).json({ error: data.message || 'Error en Resend' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Error del servidor' });
  }
}
