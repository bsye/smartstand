import OpenAI from "openai";
import csv from 'csvtojson'
import { Pinecone } from '@pinecone-database/pinecone'

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_KEY,
    environment: "us-east-1-aws"
})
const index = pinecone.index("smartstand")

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

const readCSVFile = async () => {
    let res = await fetch('https://main--smartstand.netlify.app/catalog.csv', {
        method: 'get',
    })

    return await csv({ delimiter: ';' }).fromString(await res.text())
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