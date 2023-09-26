import OpenAI from "openai";
import csv from 'csvtojson'
import { Pinecone } from '@pinecone-database/pinecone'

const pinecone = new Pinecone({
    apiKey: "c0191b90-9f60-4c09-9e34-7db2275962e8",
    environment: "us-east-1-aws"
})
const index = pinecone.index("smartstand")

const openai = new OpenAI({
    apiKey: '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'
});

const readCSVFile = async () => {
    return await csv({ delimiter: ';' }).fromFile('./catalog.csv')
}

const generateEmbeddings = async () => {
    let dataset = await readCSVFile()
    let embeddings = []
    
    for (const data of dataset) {
        let updatedData = { title: data.title, description: data.description }
        let metadata = { boxId: data.boxId, image: data.image, title: data.title }

        const embedding = await openai.embeddings.create({
            input: JSON.stringify(updatedData),
            model: 'text-embedding-ada-002'
        })

        embeddings.push({ id: data.boxId, values: embedding.data[0].embedding, metadata: metadata })
    }

    return embeddings
}

const saveEmbeddings = async () => {
    let embeddings = await generateEmbeddings()

    for (let i = 0; embeddings.length > i; i++) {
        await index.upsert([ embeddings[i]]);
    }
}

const embedQuery = async (query) => {
    const embedding = await openai.embeddings.create({
        input: query,
        model: 'text-embedding-ada-002'
    })

    let res = await index.query({ vector: embedding.data[0].embedding, topK: 30, includeMetadata: true})
    
    return res.matches[0].metadata
}

export const searchQuery = async (query) => {
    await saveEmbeddings()
    return await embedQuery(query)
}