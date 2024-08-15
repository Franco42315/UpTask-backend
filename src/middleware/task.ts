import { NextFunction, Request, Response } from "express"

export async function hasAutorization(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.user.id.toString() !== req.project.manager.toString()) {
      const error = new Error('Acción no válida')
      return res.status(400).json({ error: error.message })
    }
    next()
  } catch (error) {
    res.status(500).json({ error: "Hubo un error" })
  }
}