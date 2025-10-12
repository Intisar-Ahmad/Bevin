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