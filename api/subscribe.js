export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { email, nombre } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Falta email' });

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Falta BREVO_API_KEY en Vercel' });

  // CONFIGURACIÓN CLAVE:
  const CORREO_REMITENTE = 'tu-correo-real-de-brevo@gmail.com'; // <<< CAMBIAR AQUÍ: Pon tu correo verificado en Brevo
  const LISTA_ID = 2; // <<< CAMBIAR AQUÍ: Pon el número de ID de tu lista de Brevo (ej: 2)

  try {
    // 1. Guardar contacto en Brevo y asignarlo a la lista de suscriptores
    const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        email: email,
        updateEnabled: true,
        listIds: [LISTA_ID] // Vincula el contacto a la lista
      })
    });

    if (!contactRes.ok && contactRes.status !== 400) {
      const errData = await contactRes.json();
      console.error('Error al guardar contacto en Brevo:', errData);
    }

    // 2. Enviar correo de bienvenida inmediato al usuario
    const htmlBienvenida = `
      <div style="font-family:'Courier New',monospace;background:#000;color:#fff;padding:20px;text-align:center;max-width:600px;margin:0 auto;border:2px solid #ff0000;">
        <h1 style="color:#ff0000;text-transform:uppercase;margin-top:0;">polerasdeemoji</h1>
        <p><strong>REGISTRO CONFIRMADO EN LA NUBE REAL</strong></p>
        <hr style="border-color:#ff0000;" />
        <p>Gracias por registrarte, ${nombre || 'suscriptor'}.</p>
        <p>Has asegurado tu lugar en la lista de alertas. Cada vez que registremos una nueva prenda en el catálogo, recibirás un aviso automático.</p>
        <br />
        <a href="https://polerasdeemoji.vercel.app" style="background:#ff0000;color:#fff;padding:12px 20px;text-decoration:none;font-weight:bold;display:inline-block;">IR A LA TIENDA</a>
      </div>`;

    const emailRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: { name: 'polerasdeemoji', email: CORREO_REMITENTE },
        to: [{ email: email }],
        subject: 'Bienvenido a polerasdeemoji // Registro completado',
        htmlContent: htmlBienvenida
      })
    });

    const emailData = await emailRes.json();
    if (!emailRes.ok) {
      console.error('Error al enviar correo de bienvenida:', emailData);
      return res.status(502).json({ error: emailData.message || 'Error al enviar mail de bienvenida' });
    }

    return res.status(200).json({ success: true, message: 'Suscrito con éxito' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error en el servidor al procesar la suscripción' });
  }
}
