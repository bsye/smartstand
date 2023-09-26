import { searchQuery } from "../semanticSearch.js";
import express, { Router } from 'express'
import serverless from 'serverless-http';

const api = express()
api.use(express.json())

const router = Router()

router.post('/', async (request, response) => {
    let res = await searchQuery(request.body.query)
    response.setHeader('Content-Type', 'application/JSON');
    return response.json(res)
})

api.use('/api/', router);
export const handler = serverless(api);