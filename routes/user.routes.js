import express from "express";
import { registerUser, greetings, verifyUser, loginUser, profile, logout } from "../Controller/user.controller.js";
import { isLoggedin } from "../Middleware/auth.middleware.js";

const router = express.Router()

router.post('/register', registerUser)
router.get('/verify/:token', verifyUser)
router.post('/login', loginUser)
router.get('/profile', isLoggedin, profile)
router.get('/logout', isLoggedin,logout )

router.get('/', greetings )

export default router;
