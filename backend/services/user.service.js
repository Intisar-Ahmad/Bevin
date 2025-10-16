import userModel from "../models/user.model.js";

export const createUser = async ({email,password}) => {
   try {
     if(!email || !password){
        throw new Error("Email and password are required");
    }

    const user = await userModel.create({email,password});

    return user;

   } catch (error) {
    
        console.log(error);

        throw error;
   }
}

