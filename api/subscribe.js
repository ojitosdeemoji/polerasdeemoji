export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { email, nombre } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Falta email' });

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Falta BREVO_API_KEY en Vercel' });

  // DATOS CONFIGURADOS
  const CORREO_REMITENTE = 'hadaddiego9@gmail.com';
  const LISTA_ID = 2;

  try {
    // 1. Registrar o actualizar contacto en Brevo dentro de la lista #2
    const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({
        email: email,
        updateEnabled: true,
        listIds: [LISTA_ID]
      })
    });

    if (!contactRes.ok && contactRes.status !== 400) {
      const errData = await contactRes.json();
      console.error('Error al guardar contacto en Brevo:', errData);
    }

    // 2. Correo de bienvenida: manifiesto y confirmación de registro
    const htmlBienvenida = `
      <div style="font-family:'Courier New',Courier,monospace;background:#000000;color:#ffffff;padding:28px 20px;text-align:left;max-width:580px;margin:0 auto;border:3px solid #ff0000;box-shadow:6px 6px 0px #ff0000;">
        
        <div style="border-bottom:2px solid #ff0000;padding-bottom:12px;margin-bottom:18px;">
          <h1 style="color:#ff0000;font-size:22px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px 0;">polerasdeemoji</h1>
          <p style="font-size:11px;color:#888888;margin:0;letter-spacing:1px;"> // ORG. SIN FINES DE LUCRO // </p>
        </div>

        <p style="font-size:14px;color:#ff0000;font-weight:bold;margin:0 0 14px 0;">
          [NOTIFICACION: ${nombre ? String(nombre).toUpperCase() : 'AGRADECIMIENTO'}]
        </p>

        <p style="font-size:13px;line-height:1.6;margin:0 0 12px 0;">
          Gracias por dejar tu correo intentando atrapar algo que no cabe en la retina reticular.
        </p>

        <p style="font-size:13px;line-height:1.6;margin:0 0 12px 0;">
          Extendemos el deseo de tenerlas, hacemos el fetiche infinito y eterno.
        </p>

        <div style="background:#111111;border:1px dashed #ff0000;padding:12px;margin:18px 0;font-size:12px;color:#ffffff;">
          <code>
            if (deseo &gt; stock) {<br/>
            &nbsp;&nbsp;precio = 0;<br/>
            &nbsp;&nbsp;urgencia = Infinity;<br/>
            &nbsp;&nbsp;return "AGOTADO";<br/>
            }
          </code>
        </div>

        <p style="font-size:12px;line-height:1.5;color:#cccccc;margin:0 0 20px 0;">
         Cada vez que una nueva pieza intente cruzar de la pantalla a la materia, recibirás una notificacion!

                                ____
                               / _\ \
                              / / _\ \_
                             / /  \   /
                             L/    \ /
                         ____       ~   _
                         \  _\         l \
                         / /            \ \
                        / /              \ \
                        \/_____     /l____\/
                         \_____>   <  ____/
                                    \l

        </p>

        <div style="text-align:center;margin:24px 0 16px 0;">
          <a href="https://polerasdeemoji.vercel.app" style="background:#ff0000;color:#000000;padding:14px 22px;text-decoration:none;font-weight:900;font-size:13px;display:inline-block;letter-spacing:1.5px;text-transform:uppercase;border:2px solid #ffffff;">
            $$$$
          </a>
        </div>

        <div style="border-top:1px solid #333333;margin-top:24px;padding-top:12px;font-size:10px;color:#666666;text-align:center;">
          polerasdeemoji // traducciones a la tela // stock: 0
        </div>
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
        subject: 'polerasdeemoji // (CONFIRMACIÓN DE REGISTRO)',
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
