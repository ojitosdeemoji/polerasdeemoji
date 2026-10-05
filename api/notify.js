export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { tituloPolera, descripcion, imagenUrl, precio } = req.body;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'polerasdeemoji <alerta@polerasdeemoji.org>',
        to: ['tu-lista-o-canal@polerasdeemoji.org'], // O tu dirección de transmisión
        subject: `NUEVO LANZAMIENTO INTANGIBLE: ${tituloPolera}`,
        html: `
          <div style="font-family: monospace; background: #000; color: #fff; padding: 20px; text-align: center;">
            <h1 style="color: #ff0000; text-transform: uppercase;">polerasdeemoji</h1>
            <p><strong>NUEVA PIEZA REGISTRADA EN EL CATÁLOGO (STOCK: 0)</strong></p>
            <hr style="border-color: #ff0000;" />
            <h2>${tituloPolera}</h2>
            <p>Precio Cyber: $0 (Antes: ${precio})</p>
            <p style="font-style: italic;">"${descripcion}"</p>
            <br />
            <a href="https://polerasdeemoji.vercel.app" style="background: #ff0000; color: #fff; padding: 12px 20px; text-decoration: none; font-weight: bold; display: inline-block;">VER EN LA TIENDA</a>
          </div>
        `
      })
    });

    if (response.ok) {
      return res.status(200).json({ success: true, message: 'Alerta enviada con éxito.' });
    } else {
      throw new Error('Error al enviar email');
    }
  } catch (err) {
    return res.status(500).json({ error: 'Error al enviar notificaciones.' });
  }
}