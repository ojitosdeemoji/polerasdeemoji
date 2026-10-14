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

  // DATOS CONFIGURADOS
  const CORREO_REMITENTE = 'hadaddiego9@gmail.com';
  const LISTA_ID = 2;

  try {
    // 1. Obtener la lista de correos suscritos desde Brevo
    const listReq = await fetch(`https://api.brevo.com/v3/contacts/lists/${LISTA_ID}/contacts?limit=500`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      }
    });

    const listData = await listReq.json();
    const contactos = listData.contacts || [];

    if (contactos.length === 0) {
      return res.status(200).json({ success: true, message: 'No hay suscriptores en la lista para notificar.' });
    }

    // 2. Armar el diseño neo-brutalista del correo
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

    // 3. Preparar destinatarios de forma individual (ocultos entre sí)
    const destinatarios = contactos.map(c => ({
      to: [{ email: c.email }]
    }));

    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        sender: { name: 'polerasdeemoji', email: CORREO_REMITENTE },
        subject: `NUEVO LANZAMIENTO INTANGIBLE: ${tituloPolera}`,
        htmlContent: htmlContent,
        messageVersions: destinatarios
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: data.message || 'Error al enviar mail a los suscriptores' });

    return res.status(200).json({ success: true, count: destinatarios.length });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al enviar notificaciones' });
  }
}
