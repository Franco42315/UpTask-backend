import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const bearer = req.headers.authorization;

  if (!bearer) {
    return res.status(401).json({ error: "No Autorizado" });
  }

  const token = bearer.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof decoded === "object" && "id" in decoded) {
      const user = await User.findById(decoded.id).select("_id name email");
      if (user) {
        req.user = user;
        return next();
      } else {
        return res.status(401).json({ error: "Usuario no encontrado" });
      }
    } else {
      return res.status(401).json({ error: "Token No Válido" });
    }
  } catch (error) {
    return res.status(401).json({ error: "Token No Válido" });
  }
};
