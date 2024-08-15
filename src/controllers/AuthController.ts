import { Request, Response } from "express";
import User from "../models/User";
import { checkPassword, hashPassword } from "../utils/auth";
import Token from "../models/Token";
import { generateToken } from "../utils/token";
import { AuthEmail } from "../emails/AuthEmail";
import { generateJWT } from "../utils/jwt";

export class AuthController {
  /**
   * Crea una nueva cuenta de usuario.
   *
   * Este método permite registrar una nueva cuenta. Valida si el usuario ya existe,
   * en cuyo caso devuelve un error. Si el usuario no existe, lo crea, hashea su contraseña,
   * genera un token de confirmación, envía un correo de confirmación, y guarda tanto el usuario
   * como el token en la base de datos.
   *
   * @param {Request} req - La solicitud HTTP.
   * @param {Response} res - La respuesta HTTP.
   * @returns {Promise<void>}
   */
  static createAccount = async (req: Request, res: Response) => {
    try {
      const { password, email } = req.body;
      // Prevenir duplicados
      const userExist = await User.findOne({ email });
      if (userExist) {
        const error = new Error("El Usuario ya esta registrado");
        return res.status(409).json({ error: error.message });
      }
      // Crea un usuario
      const user = new User(req.body);
      // Hash password
      user.password = await hashPassword(password);
      // Generar token
      const token = new Token();
      token.token = generateToken();
      token.user = user.id;
      // enviar email
      AuthEmail.sendConfirmationEmail({
        email: user.email,
        name: user.name,
        token: token.token,
      });
      // Almacena el usuario y el token
      await Promise.allSettled([user.save(), token.save()]);
      res.send("Cuenta creada, revisa tu email para confirmarla");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  /**
   * Confirma la cuenta del usuario.
   *
   * Este método valida el token de confirmación recibido, y si es válido, marca la cuenta
   * del usuario como confirmada y elimina el token de la base de datos.
   *
   * @param {Request} req - La solicitud HTTP.
   * @param {Response} res - La respuesta HTTP.
   * @returns {Promise<void>}
   */
  static confirmAccount = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      const tokenExist = await Token.findOne({ token });
      if (!tokenExist) {
        const error = new Error("Token no válido");
        return res.status(404).json({ error: error.message });
      }

      const user = await User.findById(tokenExist.user);
      user.confirmed = true;

      await Promise.allSettled([user.save(), tokenExist.deleteOne()]);

      res.send("Cuenta confirmada correctamente");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  /**
   * Inicia sesión del usuario.
   *
   * Este método permite que un usuario inicie sesión. Valida la existencia del usuario,
   * la confirmación de la cuenta, y la corrección de la contraseña. Si todo es válido,
   * genera un token JWT para la sesión.
   *
   * @param {Request} req - La solicitud HTTP.
   * @param {Response} res - La respuesta HTTP.
   * @returns {Promise<void>}
   */
  static login = async function (req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        const error = new Error("Usuario no encontrado");
        return res.status(404).json({ error: error.message });
      }
      if (!user.confirmed) {
        const token = new Token();
        token.user = user.id;
        token.token = generateToken();
        await token.save();
        AuthEmail.sendConfirmationEmail({
          email: user.email,
          name: user.name,
          token: token.token,
        });
        const error = new Error(
          "La cuenta no ha sido confirmada, hemos enviado un email de confirmación"
        );
        return res.status(401).json({ error: error.message });
      }
      // Revisar password
      const isPasswordCorrect = await checkPassword(password, user.password);
      if (!isPasswordCorrect) {
        const error = new Error("Password incorrecto");
        return res.status(401).json({ error: error.message });
      }
      const token = generateJWT({ id: user.id });
      res.send(token);
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  /**
   * Solicita un nuevo código de confirmación.
   *
   * Este método permite que un usuario solicite un nuevo token de confirmación si no ha
   * confirmado su cuenta. Genera un nuevo token y lo envía por correo electrónico.
   *
   * @param {Request} req - La solicitud HTTP.
   * @param {Response} res - La respuesta HTTP.
   * @returns {Promise<void>}
   */
  static requestConfirmationCode = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      // Usuario existe
      const user = await User.findOne({ email });
      if (!user) {
        const error = new Error("El Usuario no esta registrado");
        return res.status(404).json({ error: error.message });
      }
      if (user.confirmed) {
        const error = new Error("El Usuario ya esta confirmado");
        return res.status(409).json({ error: error.message });
      }
      // Generar token
      const token = new Token();
      token.token = generateToken();
      token.user = user.id;
      // enviar email
      AuthEmail.sendConfirmationEmail({
        email: user.email,
        name: user.name,
        token: token.token,
      });
      // Almacena el usuario y el token
      await Promise.allSettled([user.save(), token.save()]);
      res.send("Se envio un nuevo token a tu email");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  /**
   * Solicita la recuperación de la contraseña.
   *
   * Este método permite que un usuario inicie el proceso de recuperación de contraseña.
   * Genera un token de recuperación y lo envía al correo del usuario con instrucciones.
   *
   * @param {Request} req - La solicitud HTTP.
   * @param {Response} res - La respuesta HTTP.
   * @returns {Promise<void>}
   */
  static forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      // Usuario existe
      const user = await User.findOne({ email });
      if (!user) {
        const error = new Error("El Usuario no esta registrado");
        return res.status(404).json({ error: error.message });
      }

      // Generar token
      const token = new Token();
      token.token = generateToken();
      token.user = user.id;
      await token.save();
      // enviar email
      AuthEmail.sendPasswordResetToken({
        email: user.email,
        name: user.name,
        token: token.token,
      });
      // Almacena el usuario y el token
      res.send("Revisa tu email para instrucciones");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  /**
   * Valida un token de recuperación de contraseña.
   *
   * Este método verifica si el token de recuperación proporcionado es válido y
   * responde con una confirmación para permitir el cambio de contraseña.
   *
   * @param {Request} req - La solicitud HTTP.
   * @param {Response} res - La respuesta HTTP.
   * @returns {Promise<void>}
   */
  static validateToken = async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      const tokenExist = await Token.findOne({ token });
      if (!tokenExist) {
        const error = new Error("Token no válido");
        return res.status(404).json({ error: error.message });
      }
      res.send("Token valido, Define tu nuevo password");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  /**
   * Actualiza la contraseña del usuario.
   *
   * Este método permite que un usuario actualice su contraseña utilizando un token
   * de recuperación válido. Si el token es válido, la nueva contraseña es hasheada y guardada.
   *
   * @param {Request} req - La solicitud HTTP.
   * @param {Response} res - La respuesta HTTP.
   * @returns {Promise<void>}
   */
  static updatePassword = async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      const tokenExist = await Token.findOne({ token });
      if (!tokenExist) {
        const error = new Error("Token no válido");
        return res.status(404).json({ error: error.message });
      }

      const user = await User.findById(tokenExist.user);
      user.password = await hashPassword(password);

      await Promise.allSettled([user.save(), tokenExist.deleteOne()]);
      res.send("El password se modificó correctamente");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  /**
   * Devuelve los detalles del usuario autenticado.
   *
   * Este método responde con la información del usuario que ha sido autenticado
   * mediante un token JWT.
   *
   * @param {Request} req - La solicitud HTTP.
   * @param {Response} res - La respuesta HTTP.
   * @returns {Promise<void>}
   */
  static user = async (req: Request, res: Response) => {
    return res.json(req.user);
  };

  static updateProfile = async (req: Request, res: Response) => {
    const { name, email } = req.body;

    const userExist = await User.findOne({ email });

    if (userExist && userExist.id.toString() !== req.user.id.toString()) {
      const error = new Error("Este email ya esta registrado");
      return res.status(409).json({ error: error.message });
    }

    req.user.name = name;
    req.user.email = email;

    try {
      await req.user.save();
      res.send("Perfil actualizado correctamente");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  static updateCurrentUserPassword = async (req: Request, res: Response) => {
    const { current_password, password } = req.body;
    const user = await User.findById(req.user.id);

    const isPasswordCorrect = await checkPassword(current_password, user.password);
    if (!isPasswordCorrect) {
      const error = new Error("El password actual es incorrecto");
      return res.status(401).json({ error: error.message });
    }

    try {
      user.password = await hashPassword(password);
      await user.save();
      res.send("El passowrd se modifico correctamente");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  static checkPassword = async (req: Request, res: Response) => {
    const { password } = req.body

    const user = await User.findById(req.user.id);

    const isPasswordCorrect = await checkPassword(password, user.password);
    if (!isPasswordCorrect) {
      const error = new Error("El password actual incorrecto");
      return res.status(401).json({ error: error.message });
    }

    res.send('Password correcto')
  }
}
