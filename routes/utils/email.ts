import { Resend } from "resend";
import { HTTPError } from "h3";

export const sendVerificationEmail = async (
  email: string,
  token: string,
  name: string,
): Promise<void> => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new HTTPError("Server configuration error: RESEND_API_KEY not set.", { status: 500 });
  }

  const appUrl = process.env.APP_URL;
  if (!appUrl) {
    throw new HTTPError("Server configuration error: APP_URL not set.", { status: 500 });
  }

  const resend = new Resend(apiKey);
  const verificationUrl = `${appUrl}/verify-email?token=${token}`;

  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verifica tu cuenta de Entipedia</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <tr>
                <td style="padding: 40px 30px;">
                  <h1 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #1C2431;">¡Bienvenido a Entipedia, ${name}!</h1>
                  <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                    Gracias por registrarte. Para completar tu registro, necesitamos verificar tu dirección de correo electrónico.
                  </p>
                  <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #4a5568;">
                    Haz clic en el botón de abajo para verificar tu cuenta:
                  </p>
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="text-align: center; padding: 0 0 30px 0;">
                        <a href="${verificationUrl}" style="display: inline-block; padding: 14px 28px; background-color: #1C2431; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 500;">Verificar mi cuenta</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #718096;">
                    O copia y pega este enlace en tu navegador:
                  </p>
                  <p style="margin: 0 0 30px 0; font-size: 14px; line-height: 1.6; color: #4a90e2; word-break: break-all;">
                    ${verificationUrl}
                  </p>
                  <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #a0aec0;">
                    Este enlace expirará en 24 horas. Si no creaste una cuenta en Entipedia, puedes ignorar este correo.
                  </p>
                </td>
              </tr>
            </table>
            <table role="presentation" style="max-width: 600px; margin: 20px auto 0 auto;">
              <tr>
                <td style="text-align: center; padding: 20px;">
                  <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                    © ${new Date().getFullYear()} Entipedia. Todos los derechos reservados.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await resend.emails.send({
      from: "Entipedia <onboarding@resend.dev>",
      to: email,
      subject: "Verify your Entipedia account",
      html: htmlTemplate,
    });
  } catch {
    throw new HTTPError("Failed to send verification email.", { status: 500 });
  }
};
