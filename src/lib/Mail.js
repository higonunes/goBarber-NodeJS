import nodemailer from 'nodemailer';
import expressHandlebars from 'express-handlebars';
import nodemailerExpressHandlebars from 'nodemailer-express-handlebars';
import { resolve } from 'path';
import mailConfg from '../config/mail';

class Mail {
  constructor() {
    const { host, port, secure, auth } = mailConfg;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: auth.user ? auth : null,
    });

    this.configureTemplates();
  }

  configureTemplates() {
    const viewPath = resolve(__dirname, '..', 'app', 'views', 'emails');

    this.transporter.use(
      'compile',
      nodemailerExpressHandlebars({
        viewEngine: expressHandlebars.create({
          extname: '.hbs',
          layoutsDir: resolve(viewPath, 'layouts'),
          partialsDir: resolve(viewPath, 'partials'),
          defaultLayout: 'default',
        }),
        viewPath,
        extName: '.hbs',
      })
    );
  }

  sendMail(message) {
    return this.transporter.sendMail({
      ...mailConfg.default,
      ...message,
    });
  }
}

export default new Mail();
