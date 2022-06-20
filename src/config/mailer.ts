import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { join } from 'path';

export default {
  transport: {
    host: process.env.EMAIL_SMTP_HOST,
    port: Number(process.env.EMAIL_SMTP_PORT),
    auth: {
      user: process.env.EMAIL_SMTP_USER,
      pass: process.env.EMAIL_SMTP_PASS,
    },
  },
  defaults: {
    from: '"No Reply" <noreply@altart.tk>',
  },
  template: {
    dir: join(__dirname, '../templates'),
    adapter: new PugAdapter(),
    options: {
      strict: true,
    },
  },
};
