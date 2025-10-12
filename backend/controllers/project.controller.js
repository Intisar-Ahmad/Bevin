// import Project from "../models/project.model.js";
import { createProject } from "../services/project.service.js";
import { validationResult } from "express-validator";

export const createProjectController = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {name} = req.body;
    const creatorId = req.user._id;

    console.log(creatorId,name)

    if(!name || !creatorId) return res.status(400).json({errors:"Name and creator-id are required"})

    const newProject = await createProject(name,creatorId);

    res.status(201).json({newProject});

  } catch (error) {
    console.log(error)
    res.status(500).json({errors:error.message})
  }

};
