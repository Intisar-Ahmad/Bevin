import jwt from "jsonwebtoken";
import redisClient from "../services/redis.service.js";
import User from "../models/user.model.js";

export const authUserMiddleware = async (req,res,next) => {
    try {
        const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ','');
        // console.log("Token:", token);
        
        if(!token){
            return res.status(401).json({errors:"No token, authorization denied"});
        }

        const isBlacklisted = await redisClient.get(token);

        if(isBlacklisted){

            res.cookies("token","");

            return res.status(401).json({errors:"Invalid token"});
        }


   
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        
        const user = await User.findById(decoded._id);

        if(!user){
            return res.status(401).json({errors:"User not found"});
        }
        
        console.log(decoded)


        req.user = user.toObject();
        next();

    } catch (error) {
        // console.log(error);
        return res.status(401).json({errors:"Token is not valid"});
    }
}