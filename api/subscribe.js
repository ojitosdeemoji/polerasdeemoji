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
    // 1. Guardar siempre el contacto en la audiencia de Resend
    const contactRes = await fetch('https://api.resend.com/audiences/1f6a0ca1-285f-4fae-9015-35efdc250845/contacts', {
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

    if (!contactRes.ok) {
      const errData = await contactRes.json();
      console.error('Error al guardar contacto:', errData);
      return res.status(contactRes.status).json({ error: errData.message || 'Error al guardar contacto' });
    }

    // 2. Intentar enviar el correo de bienvenida
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          from: 'polerasdeemoji <onboarding@resend.dev>',
          to: [email],
          subject: '¡REGISTRO CONFIRMADO! // POLERASDEEMOJI',
          html: `
            <div style="background-color: #000000; color: #00ff00; font-family: 'Courier New', Courier, monospace; padding: 24px; border: 2px solid #00ff00; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #ffffff; margin-top: 0; font-size: 20px; border-bottom: 1px solid #00ff00; padding-bottom: 8px;">
                POLERASDEEMOJI.ORG
              </h1>
              
              <p style="color: #ffffff; font-size: 14px; margin-top: 16px;">
                ¡Hola ${nombre || 'suscriptor'}! Estamos felices de que te hayas registrado.
              </p>
              
              <p style="color: #00ff00; font-size: 14px;">
                ¡Felicidades! Este es el primer correo de muchos, disfrute su spam!
              
              </p>

              <pre style="color: #00ff00; font-size: 12px; line-height: 1.2; background-color: #111111; padding: 12px; border: 1px dashed #00ff00; overflow-x: auto; font-family: monospace;">
                                                                                                             
                                                                                                       
                                                                                                       
                                                                                                       
                                                                                                       
                                                                                                       
                                                                                                       
                 ██████████████████                         █████████████████████                      
                  █████████████████               ███████████ █████████████████████                    
                     ████████████████           ██████████████ █████████████████████                   
                    ██████████████████         █████████████████ ████████████████████                  
                   ███████████████████        ████████████████████████████████████████    ██           
                  █████████████████████      █████████████████████ ████████████████████████            
                 ████████████████████████   █████████████████████   ██████████████████████             
                ██████████████████████████ █████████████████████     ████████████████████              
               ████████████████████      ██████████████████████       ██████████████████               
             ██████████████████████      █████████████████████         ████████████████                
             ████████████████████           █████████████████          ███████████████                 
           █████████████████████               █████████████        █████████████████                  
          ██████████████████████                  ████████                                  ██         
         █████████████████████                       ████                               ████████       
        █████████████████████                                                        ████████████      
       █████████████████████                                                      ████████████████     
      █████████████████████                                                    ████████████████████    
     █████████████████████                                                     █████████████████████   
    █████████████████████                                                       █████████████████████  
   █████████████████████                                                         █████████████████████ 
  █████████████████████                                                           ████████████████████ 
 █████████████████████                                                             ███████████████████ 
 ████████████████████                                                               ██████████████████ 
  ██████████████████                                                       ██        ████████████████  
    ███████████████                                                        ██          ████████████    
    ██████████████                                                       ████                    ██    
      ██████████████████████████████████████████████████████████        ██████████████████████████     
       █████████████████████████████████████████████████████████       ██████████████████████████      
        ████████████████████████████████████████████████████████      ██████████████████████████       
         ███████████████████████████████████████████████████████     ██████████████████████████        
          ██████████████████████████████████████████████████████    ██████████████████████████         
           █████████████████████████████████████████████████████    █████████████████████████          
             ███████████████████████████████████████████████████     ███████████████████████           
              ██████████████████████████████████████████████████       ████████████████████            
                ████████████████████████████████████████████████        ██████████████████             
                   █████████████████████████████████████████████         ███████████████               
                                                                          ███                          
                                                                           ██                          
                                                                            █                          
                                                                                                       
                                                                                                       
                                                                                                       
                                                                                                       

              </pre>

              <hr style="border: 0; border-top: 1px solid #333333; margin: 20px 0;" />
              <p style="font-size: 11px; color: #888888; margin-bottom: 0;">
                Organización sin fines de lucro // Registro no comercial.
              </p>
            </div>
          `
        })
      });
    } catch (e) {
      console.log('No se pudo despachar el correo (normal en plan gratuito si es cuenta externa)');
    }

    // Responder siempre con éxito porque el contacto ya quedó guardado en la lista
    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Error del servidor:', err);
    return res.status(500).json({ error: 'Error del servidor' });
  }
}
