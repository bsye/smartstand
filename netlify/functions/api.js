import { searchQuery, importEmbeddings } from "../../semanticSearch.js";
import cors from 'cors'
import express, { Router } from 'express'
import serverless from 'serverless-http';

const api = express()
api.use(express.json())
api.use(cors({
    origin: '*',
}))

const router = Router()

router.post('/', async (request, response) => {
    let res = await searchQuery(request.body.query)
    response.setHeader('Content-Type', 'application/JSON');
    return response.json(res)
})

router.post('/update', async (request, response) => {
    await importEmbeddings()
    response.setHeader('Content-Type', 'application/JSON');
    return response.status(204).send();
})

api.use('/api/', router);
export const handler = serverless(api);