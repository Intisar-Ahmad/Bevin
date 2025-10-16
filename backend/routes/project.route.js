import { Router } from "express";
import { body } from "express-validator";
import { createProjectController,getAllProject,addUser } from "../controllers/project.controller.js";
import { authUserMiddleware } from "../middleware/auth.middleware.js";
const router = Router();

router.post('/create',
    body('name').isString().withMessage("Name must be String").notEmpty().withMessage("Name is required"),
    authUserMiddleware,
    createProjectController

)

router.get('/all',
    authUserMiddleware,
    getAllProject
)

router.patch('/add-users', 
    authUserMiddleware,
    body('userIds')
        .isArray({ min: 1 }).withMessage("userIds must be a non-empty array")
        .custom((arr) => arr.every(id => typeof id === 'string' && id.trim() !== ''))
        .withMessage("Every userId must be a non-empty string"),
    body('projectId')
        .isString().withMessage("ProjectId must be String").notEmpty().withMessage("ProjectId is required"),
    addUser
)

export default router;