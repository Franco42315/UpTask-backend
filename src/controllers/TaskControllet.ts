import type { Request, Response } from "express";
import Task from "../models/Task";

export class TaskController {
  // Método para crear una nueva tarea
  static createTask = async (req: Request, res: Response) => {
    try {
      // Extrae los datos de la tarea del req.body
      const task = new Task(req.body);
      // Como el proyecto si existe asigna la id del proyecto a la tarea
      task.project = req.project.id;
      req.project.tasks.push(task.id);
      // Almacena la id de la tarea en el proyecto y la tarea en la base de datos
      await Promise.allSettled([task.save(), req.project.save()]);
      // Devuelve el texto al guardar la tarea en la base de datos
      res.send("Tarea Creada Correctamente");
    } catch (error) {
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  static getProjectTask = async (req: Request, res: Response) => {
    try {
      const tasks = await Task.find({
        project: req.project.id,
      }).populate("project");
      res.json(tasks);
    } catch (error) {
      console.log(error);

      res.status(500).json({ error: "Hubo un error" });
    }
  };

  static getTaskById = async (req: Request, res: Response) => {
    try {
      const task = await Task.findById(req.task.id)
        .populate({
          path: "completedBy.user",
          select: "id name email",
        })
        .populate({
          path: "notes",
          populate: { path: "createdBy", select: "_id name email" },
        });
      res.json(task);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  static updateTask = async (req: Request, res: Response) => {
    try {
      req.task.name = req.body.name;
      req.task.description = req.body.description;
      await req.task.save();
      res.send("Tarea Actualizada Correctamente");
    } catch (error) {
      return res.status(500).json({ error: "Hubo un error" });
    }
  };

  static deleteTask = async (req: Request, res: Response) => {
    try {
      req.project.tasks = req.project.tasks.filter(
        (task) => task.toString() !== req.task.id.toString()
      );

      await Promise.allSettled([req.task.deleteOne(), req.project.save()]);

      res.send("Tarea Eliminada Correctamente");
    } catch (error) {
      return res.status(500).json({ error: "Hubo un error" });
    }
  };

  static updateStatusTask = async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      req.task.status = status;

      const data = {
        user: req.user.id,
        status,
      };

      req.task.completedBy.push(data);

      await req.task.save();
      res.send("Tarea Actualizada");
    } catch (error) {
      return res.status(500).json({ error: "Hubo un error" });
    }
  };
}
