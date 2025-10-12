import { Router } from "express";
import { body } from "express-validator";
import { createProjectController } from "../controllers/project.controller.js";
import { authUserMiddleware } from "../middleware/auth.middleware.js";
const router = Router();

router.post('/create',
    body('name').isString().withMessage("Name must be String").notEmpty().withMessage("Name is required"),
    authUserMiddleware,
    createProjectController

)

export default router;