import { transport } from "../config/nodemailer";

interface IEmail {
  email: string;
  name: string;
  token: string;
}

export class AuthEmail {
  static sendConfirmationEmail = async (user: IEmail) => {
    const info = await transport.sendMail({
      from: "UpTask <admin@uptask.com>",
      to: user.email,
      subject: "UpTask - Confirma tu cuenta",
      text: "UpTask - Confirma tu cuenta",
      html: `
        <p>
          Hola: ${user.name}, has creado tu cuenta en UpTask, ya casi esta todo losto, solo debes confirmar tu cuenta
        </p>
        <p>
          Visita el siguiente enlace: 
        </p>
        <a href="${process.env.URL_FRONT}/auth/confirm-account">Confirmar cuenta</a>
        <p>Ingresa el código: <b>${user.token}</b></p>
        <p>Este token expira en 10 minutos</p>
      `,
    });
  };

  static sendPasswordResetToken = async (user: IEmail) => {
    const info = await transport.sendMail({
      from: "UpTask <admin@uptask.com>",
      to: user.email,
      subject: "UpTask - Reestablece tu password",
      text: "UpTask - Reestablece tu password",
      html: `
        <p>
          Hola: ${user.name}, has solicitado reestablecer tu password.
        </p>
        <p>
          Visita el siguiente enlace: 
        </p>
        <a href="${process.env.URL_FRONT}/auth/new-password">Reestablecer Password</a>
        <p>Ingresa el código: <b>${user.token}</b></p>
        <p>Este token expira en 10 minutos</p>
      `,
    });
  };
}
