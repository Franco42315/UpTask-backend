import type { Request, Response, NextFunction } from "express"
import Project, { IProject } from "../models/Project"
import Task, { ITask } from "../models/Task"

declare global {
  namespace Express {
    interface Request {
      project: IProject,
      task: ITask
    }
  }
}

export async function validateProjectExist(req: Request, res: Response, next: NextFunction) {
  try {
    // Extrae la url del proyecto mediante los parametros de la url
    const { projectId } = req.params
    // Verifica que el proyecto existe
    const project = await Project.findById(projectId)
    if (!project) {
      const error = new Error('Proyecto No Encontrado')
      return res.status(404).json({ error: error.message })
    }
    req.project = project
    next()
  } catch (error) {
    res.status(500).json({ error: "Hubo un error" })
  }
}

export async function validateTaskExist(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const task = await Task.findById(id)
    if (!task) {
      const error = new Error('Tarea No Encontrada')
      return res.status(404).json({ error: error.message })
    }
    req.task = task
    next()
  } catch (error) {
    res.status(500).json({ error: "Hubo un error" })
  }
}

export async function taskbelongtoproyect(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.task.project.toString() !== req.project.id.toString()) {
      const error = new Error('Acción no válida')
      return res.status(400).json({ error: error.message })
    }
    next()
  } catch (error) {
    res.status(500).json({ error: "Hubo un error" })
  }
}