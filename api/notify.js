const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const secret = process.env.NOTIFY_SECRET;
  if (!secret) return res.status(500).json({ error: 'Falta NOTIFY_SECRET en Vercel' });
  if (req.headers['x-notify-secret'] !== secret) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Falta BREVO_API_KEY en Vercel' });

  const { tituloPolera, descripcion, imagenUrl, precio } = req.body || {};
  if (!tituloPolera) return res.status(400).json({ error: 'Falta tituloPolera' });

  const htmlContent = `
    <div style="font-family:'Courier New',monospace;background:#000;color:#fff;padding:20px;text-align:center;max-width:600px;margin:0 auto;border:2px solid #ff0000;">
      <h1 style="color:#ff0000;text-transform:uppercase;margin-top:0;">polerasdeemoji</h1>
      <p><strong>NUEVA PIEZA REGISTRADA EN EL CATÁLOGO (STOCK: 0)</strong></p>
      <hr style="border-color:#ff0000;" />
      ${imagenUrl ? `<img src="${esc(imagenUrl)}" alt="${esc(tituloPolera)}" width="320" style="max-width:100%;height:auto;border:2px solid #fff;margin:12px 0;" />` : ''}
      <h2>${esc(tituloPolera)}</h2>
      <p>Precio Cyber: $0 (Antes: ${esc(precio)})</p>
      <p style="font-style:italic;">"${esc(descripcion)}"</p>
      <br />
      <a href="https://polerasdeemoji.vercel.app" style="background:#ff0000;color:#fff;padding:12px 20px;text-decoration:none;font-weight:bold;display:inline-block;">VER EN LA TIENDA</a>
    </div>`;

  try {
    // Envía la campaña a todos los contactos registrados en Brevo
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: { name: 'polerasdeemoji', email: 'tu-correo-de-brevo@gmail.com' }, // Cambia esto por el correo con el que te registraste en Brevo
        to: [{ email: 'tu-correo-de-brevo@gmail.com' }], // O si usas listas en Brevo, se configura vía campañas
        subject: `NUEVO LANZAMIENTO INTANGIBLE: ${tituloPolera}`,
        htmlContent: htmlContent
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: data.message || 'Error al enviar mail' });

    return res.status(200).json({ success: true, id: data.messageId });
  } catch (err) {
    return res.status(500).json({ error: 'Error al enviar notificaciones' });
  }
}
