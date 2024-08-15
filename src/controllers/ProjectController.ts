import type { Request, Response } from "express";
import Project from "../models/Project";

export class ProjectController {
  static createProject = async (req: Request, res: Response) => {
    const project = new Project(req.body);

    // Asigna un manager
    project.manager = req.user.id

    try {
      await project.save();
      res.send("Proyecto Creado Correctamente");
    } catch (error) {
      console.log(error);
    }
  };

  static getAllProjects = async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: "No Autorizado" });
    }

    try {
      const projects = await Project.find({
        $or: [
          { manager: { $in: req.user._id } },
          {team: {$in: req.user._id}}
        ]
      });
      res.json(projects);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Error al obtener los proyectos" });
    }
  };

  static getProjectById = async (req: Request, res: Response) => {
    const { projectId } = req.params;

    try {
      const project = await Project.findById(projectId).populate("tasks");

      if (!project) {
        const error = new Error("Proyecto No Encontrado");
        return res.status(404).json({ error: error.message });
      }

      if(project.manager.toString() !== req.user.id.toString() && !project.team.includes(req.user.id)){
        const error = new Error("Acción no válida");
        return res.status(404).json({ error: error.message });
      }
      res.json(project);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Hubo un error" });
    }
  };

  static updateProject = async (req: Request, res: Response) => {
    try {

      req.project.projectName = req.body.projectName;
      req.project.clientName = req.body.clientName;
      req.project.description = req.body.description;

      await req.project.save();
      res.send("Proyecto Actualizado");
    } catch (error) {
      console.log(error);
    }
  };

  static deleteProject = async (req: Request, res: Response) => {
    try {
      await req.project.deleteOne();
      res.send("Proyecto Eliminado");
    } catch (error) {
      console.log(error);
    }
  };
}
