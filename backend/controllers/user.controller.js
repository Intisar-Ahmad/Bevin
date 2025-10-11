import userModel from "../models/user.model.js";
import { createUser } from "../services/user.service.js";
import { validationResult } from "express-validator";
import redisClient from "../services/redis.service.js";
import { sendEmail } from "../services/sendEmail.js";
import jwt from 'jsonwebtoken'

export const registerUserController = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const user = await createUser(req.body);

    const token = await user.generateAuthToken();

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const loginUserController = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new Error("Email and password are required");
    }

    const user = await userModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ errors: "Invalid Credentials" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ errors: "Invalid Credentials" });
    }

    const token = await user.generateAuthToken();

    res.status(200).json({ user, token });
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const profileController = async (req, res) => {
  console.log(req.user);

  res.status(200).json({
    user: req.user.toObject(),
  });
};

export const logoutController = async (req, res) => {
  try {
    const token = req.cookies.token || req.header("Authorization").replace("Bearer ", "");

    redisClient.set(token, "logout", "EX", 24 * 60 * 60); // expire in 24 hours

    res.status(200).json({ msg: "Logged out successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ errors: "Something went wrong, please try again" });
  }
};

export const forgotPasswordController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Proceed with password reset logic
  try {
    const {email} = req.body;
     if (!email) {
      throw new Error("Email is required");
    }

    const user = await userModel.findOne({email});
    if(!user){
          return res
        .status(200)
        .json({ msg: "If this email exists, a reset link has been sent." });
    }

   const token = await user.generatePasswordResetToken();

   const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    console.log(user.email)
   await sendEmail({
       to: user.email,
       subject: "Password Reset",
       html: `<p>Click <a href="${link}">here</a> to reset your password. Use within 5 mins of being issued</p>`,

   });

      return res
        .status(200)
        .json({ msg: "If this email exists, a reset link has been sent." })

  } catch (error) {
    res.status(400).json({errors:error.message})
  }
};


export const resetPasswordController = async (req,res) => {
     const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
   
    try {
        const {token,password} = req.body;

        if(!token || !password) {
            return res.status(400).json({msg:"Token and Password required"});
        }
         const isBlacklisted = await redisClient.get(token);


      
              if(isBlacklisted){
      
                  res.cookies("token","");
      
                  return res.status(401).json({errors:"Invalid token"});
              }
         
           const decoded = jwt.verify(token,process.env.JWT_SECRET);
        
           const user = await userModel.findById(decoded._id).select('+password');

              if(!user){
                return res.status(401).json({msg:"User not found"})
              }

            user.password = password;
            await user.save();
           
            redisClient.set(token, "resetPassword", "EX",   15 * 60);
              

        res.json({msg:"Password reset successfully"});
    } catch (error) {
        console.log(error)
        return res.status(401).json({errors:error.message})
    }
}
