export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { email, nombre } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Falta email' });

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Falta BREVO_API_KEY en Vercel' });

  try {
    const r = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        email: email,
        attributes: { NOMBRE: nombre || '' },
        updateEnabled: true
      })
    });

    if (r.ok || r.status === 204) {
      return res.status(200).json({ success: true, message: 'Suscrito con éxito' });
    } else {
      const errData = await r.json();
      return res.status(400).json({ error: errData.message || 'Error al suscribir' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Error en el servidor' });
  }
}
