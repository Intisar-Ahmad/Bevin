import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { body } from "express-validator";
import * as authMiddleware from "../middleware/auth.middleware.js";


const router = Router();

router.post("/register",
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    userController.registerUserController);


router.post("/login",
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    userController.loginUserController
);


router.get("/profile",authMiddleware.authUserMiddleware,userController.profileController);


router.post('/logout',authMiddleware.authUserMiddleware,userController.logoutController)

export default router;
