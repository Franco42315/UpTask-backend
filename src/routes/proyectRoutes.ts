import { Router } from "express"
import { body, param } from "express-validator"
import { ProjectController } from "../controllers/ProjectController"
import { handleInputErrors } from "../middleware/validation"
import { TaskController } from "../controllers/TaskControllet"
import { taskbelongtoproyect, validateProjectExist, validateTaskExist } from "../middleware/proyect"
import { authenticate } from "../middleware/auth"
import { TeamMemberController } from "../controllers/TeamController"
import { hasAutorization } from "../middleware/task"
import { NoteController } from "../controllers/NoteController"

const router = Router()

// Middleware para autenticar todas las rutas
router.use(authenticate)

// Rutas para gestionar proyectos

// Crear un nuevo proyecto
router.post('/',
  body('projectName')
    .notEmpty().withMessage('El nombre del Proyecto es Obligatorio.'),
  body('clientName')
    .notEmpty().withMessage('El nombre del Cliente es Obligatorio.'),
  body('description')
    .notEmpty().withMessage('La Descripción es Obligatoria.'),
  handleInputErrors,
  ProjectController.createProject
)

// Obtener todos los proyectos
router.get('/', ProjectController.getAllProjects)

// Obtener un proyecto por ID
router.get('/:projectId',
  param('projectId').isMongoId().withMessage('ID no válido'),
  handleInputErrors,
  ProjectController.getProjectById
)

// Actualizar un proyecto por ID
router.put('/:projectId',
  param('projectId').isMongoId().withMessage('ID no válido'),
  body('projectName')
    .notEmpty().withMessage('El nombre del Proyecto es Obligatorio.'),
  body('clientName')
    .notEmpty().withMessage('El nombre del Cliente es Obligatorio.'),
  body('description')
    .notEmpty().withMessage('La Descripción es Obligatoria.'),
  handleInputErrors,
  hasAutorization,
  ProjectController.updateProject
)

// Eliminar un proyecto por ID
router.delete('/:projectId',
  param('projectId').isMongoId().withMessage('ID no válido'),
  handleInputErrors, hasAutorization,
  ProjectController.deleteProject
)

/* Rutas para gestionar tareas dentro de un proyecto */
router.param('projectId', validateProjectExist) // Middleware para validar existencia de proyecto
router.param('id', validateTaskExist) // Middleware para validar existencia de tarea
router.param('id', taskbelongtoproyect) // Middleware para verificar si la tarea pertenece al proyecto

// Crear una nueva tarea en un proyecto
router.post('/:projectId/tasks',
  hasAutorization, // Middleware para verificar autorización
  param('projectId').isMongoId().withMessage('ID no válido'),
  body('name')
    .notEmpty()
    .withMessage('El Nombre de la tarea es Obligatorio'),
  body('description')
    .notEmpty()
    .withMessage('La Descripción de la tarea es Obligatoria'),
  handleInputErrors,
  TaskController.createTask
)

// Obtener todas las tareas de un proyecto
router.get('/:projectId/tasks',
  param('projectId').isMongoId().withMessage('ID no válido'),
  handleInputErrors,
  TaskController.getProjectTask
)

// Obtener una tarea por ID dentro de un proyecto
router.get('/:projectId/tasks/:id',
  param('projectId').isMongoId().withMessage('ID no válido'),
  param('id').isMongoId().withMessage('ID no válido'),
  handleInputErrors,
  TaskController.getTaskById
)

// Actualizar una tarea por ID dentro de un proyecto
router.put('/:projectId/tasks/:id',
  hasAutorization, // Middleware para verificar autorización
  param('projectId').isMongoId().withMessage('ID no válido'),
  param('id').isMongoId().withMessage('ID no válido'),
  body('name')
    .notEmpty()
    .withMessage('El Nombre de la tarea es Obligatorio'),
  body('description')
    .notEmpty()
    .withMessage('La Descripción de la tarea es Obligatoria'),
  handleInputErrors,
  TaskController.updateTask
)

// Eliminar una tarea por ID dentro de un proyecto
router.delete('/:projectId/tasks/:id',
  hasAutorization, // Middleware para verificar autorización
  param('projectId').isMongoId().withMessage('ID no válido'),
  param('id').isMongoId().withMessage('ID no válido'),
  handleInputErrors,
  TaskController.deleteTask
)

// Actualizar el estado de una tarea por ID dentro de un proyecto
router.post('/:projectId/tasks/:id/status',
  body('status')
    .notEmpty().withMessage('El estado es obligatorio'),
  handleInputErrors,
  TaskController.updateStatusTask
)

/** Rutas para gestionar miembros del equipo */

/* Buscar un miembro del equipo por correo electrónico y agregarlo al proyecto */
router.post('/:projectId/team/find',
  body('email').isEmail().toLowerCase().withMessage('E-mail no válido'),
  handleInputErrors,
  TeamMemberController.findMemberByEmail
)

// Agregar un miembro al equipo por ID
router.post('/:projectId/team',
  body('id').isMongoId().withMessage('Id no válido'),
  handleInputErrors,
  TeamMemberController.addMemberById
)

// Eliminar un miembro del equipo por ID
router.delete('/:projectId/team/:userId',
  param('userId').isMongoId().withMessage('Id no válido'),
  handleInputErrors,
  TeamMemberController.removeMemberById
)

// Obtener todos los miembros del equipo de un proyecto
router.get('/:projectId/team',
  TeamMemberController.getTeamProject
)

/** Routes for Notes */

router.post('/:projectId/tasks/:id/notes',
  body('content').notEmpty().withMessage('El contenido de la nota es obligatorio'),
  handleInputErrors,
  NoteController.createNote
)

router.get('/:projectId/tasks/:id/notes',
  NoteController.getAllNotesTask
)

router.delete('/:projectId/tasks/:id/notes/:noteId',
  param('noteId').isMongoId().withMessage('Id no válido'),
  handleInputErrors,
  NoteController.deleteNote
)

export default router
