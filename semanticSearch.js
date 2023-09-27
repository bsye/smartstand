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
    let platformRequest = await fetch(`https://api.github.com/repos/bsye/smartstand-config/contents/catalog.csv`, {
        method: 'GET',
        headers: {
            "Authorization": `Bearer ${process.env.GITHUB_KEY}`
        }
    })

    let csvFile = await Buffer.from((await platformRequest.json()).content, 'base64').toString()
    return await csv({ delimiter: ';' }).fromString(csvFile)
}

const generateEmbeddings = async () => {
    let dataset = await readCSVFile()

    let embeddings = []
    
    for (const data of dataset) {
        let updatedData = { title: data.name }
        let metadata = { boxId: data.id, url: data.url, title: data.name, imageUrl: data.image, rating: data.rating, ratingCount: data['rating_count'], TArating: data["TA Rating"], TAratingCount: data["TA Review Count"], personCount: data["min_person"], price: data.price, city: data.city }

        const embedding = await openai.embeddings.create({
            input: JSON.stringify(updatedData),
            model: 'text-embedding-ada-002'
        })

        embeddings.push({ id: data.id, values: embedding.data[0].embedding, metadata: metadata })
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

    let res = await index.query({ vector: embedding.data[0].embedding, topK: 20, includeMetadata: true})
    
    return res.matches
}

export const importEmbeddings = async () => {
    await saveEmbeddings()
}

export const searchQuery = async (query) => {
    return await embedQuery(query)
}