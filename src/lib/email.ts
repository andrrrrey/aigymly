import 'server-only'
import nodemailer from 'nodemailer'

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env['SMTP_HOST'],
    port: Number(process.env['SMTP_PORT'] ?? 587),
    secure: Number(process.env['SMTP_PORT']) === 465,
    auth: {
      user: process.env['SMTP_USER'],
      pass: process.env['SMTP_PASS'],
    },
  })
}

export async function sendVerificationEmail(to: string, token: string) {
  const appUrl = process.env['APP_URL'] ?? 'http://localhost:3000'
  const from = process.env['SMTP_FROM'] ?? 'FitTracker'
  const link = `${appUrl}/api/auth/verify-email?token=${token}`
  console.log('[email] sendVerificationEmail link =', link)

  await getTransporter().sendMail({
    from,
    to,
    subject: 'Подтверди email — FitTracker',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 16px">Подтвердите email</h2>
        <p>Нажмите на кнопку ниже, чтобы подтвердить ваш адрес электронной почты.</p>
        <a href="${link}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:12px;font-weight:600">
          Подтвердить email
        </a>
        <p style="color:#6b7280;font-size:13px">Ссылка действует 24 часа. Если вы не регистрировались — проигнорируйте это письмо.</p>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const appUrl = process.env['APP_URL'] ?? 'http://localhost:3000'
  const from = process.env['SMTP_FROM'] ?? 'FitTracker'
  const link = `${appUrl}/auth/reset-password?token=${token}`

  await getTransporter().sendMail({
    from,
    to,
    subject: 'Сброс пароля — FitTracker',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 16px">Сброс пароля</h2>
        <p>Вы запросили сброс пароля для аккаунта FitTracker.</p>
        <a href="${link}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:12px;font-weight:600">
          Сбросить пароль
        </a>
        <p style="color:#6b7280;font-size:13px">Ссылка действует 1 час. Если вы не запрашивали сброс — проигнорируйте это письмо.</p>
      </div>
    `,
  })
}
