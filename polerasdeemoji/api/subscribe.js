export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, nombre } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Correo no válido' });
  }

  try {
    // Envío directo a la API de contactos de Resend
    const response = await fetch('https://api.resend.com/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
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
      console.error('Error Resend API:', data);
      return res.status(response.status).json({ error: data.message || 'Error en Resend' });
    }
  } catch (err) {
    console.error('Error Serverless Function:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}