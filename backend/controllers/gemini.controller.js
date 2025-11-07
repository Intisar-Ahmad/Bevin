import * as geminiServices from '../services/gemini.service.js';

export const generateResultController = async (req , res) => {
    try {
        const {prompt} = req.query;
        const result = await geminiServices.generateResult(prompt);
        return res.status(200).send(result);

    } catch (error) {
        console.log(error)
        return res.status(500).send({errors: error.message});
    }
}