import Project from "../models/project.model.js";


export const createProject = async (name,creatorId) => {
 try {
       if(!name || !creatorId) {
        throw new Error("Name and Creater-ID is required");
    }

    const project = await Project.create({
        name,
        creator:creatorId
    })

    return project;
 } catch (error) {
    throw error;
 }
}

export const getAllProjectByUserId = async ({ userId }) => {
    if (!userId) {
        throw new Error('UserId is required')
    }

    const allUserProjects = await Project.find({
        users: userId
    })

    return allUserProjects
}