const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Protección del endpoint
  const secret = process.env.NOTIFY_SECRET;
  if (!secret) return res.status(500).json({ error: 'Falta NOTIFY_SECRET en Vercel' });
  if (req.headers['x-notify-secret'] !== secret) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const apiKey = process.env.RESEND_API_KEY || process.env.resend_api_key;
  if (!apiKey) return res.status(500).json({ error: 'Falta RESEND_API_KEY en Vercel' });

  const audienceId = process.env.RESEND_AUDIENCE_ID || '1f6a0ca1-285f-4fae-9015-35efdc250845';
  const { tituloPolera, descripcion, imagenUrl, precio } = req.body || {};
  if (!tituloPolera) return res.status(400).json({ error: 'Falta tituloPolera' });

  const html = `
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
      <hr style="border:0;border-top:1px solid #333;margin:24px 0 12px;" />
      <p style="font-size:11px;color:#888;">Organización sin fines de lucro // Registro no comercial.<br>
      <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#888;">Cancelar suscripción</a></p>
    </div>`;

  try {
    const r = await fetch('https://api.resend.com/broadcasts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        audience_id: audienceId, // Si Resend lo rechaza, cambia "audience_id" por "segment_id"
        name: `Lanzamiento: ${tituloPolera}`,
        from: 'polerasdeemoji <alerta@polerasdeemoji.org>',
        subject: `NUEVO LANZAMIENTO INTANGIBLE: ${tituloPolera}`,
        html,
        send: true
      })
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Resend broadcast error:', data);
      return res.status(502).json({ error: data.message || 'Error al enviar broadcast' });
    }
    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al enviar notificaciones.' });
  }
}
