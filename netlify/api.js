import { searchQuery } from "../semanticSearch.js";
import express from 'express'
import serverless from 'serverless-http';

const app = express()
app.use(express.json())

const port = 3000

app.listen(port, () => {
    console.log('server listening to port 3000')
})

app.post('/', async (request, response) => {
    let res = await searchQuery(request.body.query)
    response.setHeader('Content-Type', 'application/JSON');
    return response.json(res)
})

export const handler = serverless(api);