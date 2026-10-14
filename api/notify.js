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
    // 1. Obtener los suscriptores desde la lista #2 de Brevo
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

    // 2. Correo de nueva prenda: lanzamiento, fetiche mercantil y obsolescencia
    const htmlContent = `
      <div style="font-family:'Courier New',Courier,monospace;background:#000000;color:#ffffff;padding:28px 20px;text-align:left;max-width:580px;margin:0 auto;border:3px solid #ff0000;box-shadow:6px 6px 0px #ff0000;">
        
        <div style="border-bottom:2px solid #ff0000;padding-bottom:12px;margin-bottom:18px;">
          <h1 style="color:#ff0000;font-size:22px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px 0;">polerasdeemoji</h1>
          <p style="font-size:11px;color:#888888;margin:0;letter-spacing:1px;">NUEVA PIEZA REGISTRADA // TRADUCCIÓN </p>
        </div>

        <p style="font-size:14px;color:#ff0000;font-weight:bold;margin:0 0 10px 0;">
          [AVISO DE **** ]
        </p>

        <p style="font-size:13px;line-height:1.6;margin:0 0 16px 0;">
          un nuevo artefacto ha sido inscrito en el archivo físico
        </p>

        ${imagenUrl ? `
        <div style="text-align:center;margin:18px 0;background:#0a0a0a;padding:12px;border:1px solid #333333;">
          <img src="${esc(imagenUrl)}" alt="${esc(tituloPolera)}" width="360" style="max-width:100%;height:auto;border:2px solid #ffffff;display:inline-block;" />
        </div>` : ''}

        <div style="border-left:3px solid #ff0000;padding-left:14px;margin:16px 0;">
          <h2 style="font-size:18px;margin:0 0 6px 0;color:#ffffff;text-transform:uppercase;">${esc(tituloPolera)}</h2>
          <p style="font-size:12px;color:#ff0000;margin:0 0 8px 0;font-weight:bold;">
            PRECIO OFERTA: $0 <span style="color:#666666;text-decoration:line-through;font-weight:normal;">(ANTES: ${esc(precio)})</span> // STOCK: 0
          </p>
          <p style="font-size:13px;font-style:italic;color:#cccccc;line-height:1.5;margin:0;">
            "${esc(descripcion)}"
          </p>
        </div>

        <p style="font-size:12px;line-height:1.6;color:#888888;margin:16px 0;">
         El objeto ha desaparecido.
        </p>

        <div style="text-align:center;margin:24px 0 16px 0;">
          <a href="https://polerasdeemoji.vercel.app" style="background:#ff0000;color:#000000;padding:14px 22px;text-decoration:none;font-weight:900;font-size:13px;display:inline-block;letter-spacing:1.5px;text-transform:uppercase;border:2px solid #ffffff;">
            INTERCEPTAR // VER EN LA TIENDA
          </a>
        </div>

        <div style="border-top:1px solid #333333;margin-top:24px;padding-top:12px;font-size:10px;color:#666666;text-align:center;">
          Necesito vestir lo que pienso // polerasdeemoji.vercel.app
        </div>
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
        subject: `[LANZAMIENTO INTANGIBLE] ${tituloPolera} // PRECIO: $0 (STOCK: 0)`,
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
