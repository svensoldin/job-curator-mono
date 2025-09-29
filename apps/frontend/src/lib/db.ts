import { MongoClient } from 'mongodb';

interface Job {
  description: string;
  title: string;
  url: string;
  company: string;
  score: number;
  source: string;
}

const url = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@mern.yy0tj.mongodb.net/?retryWrites=true&w=majority&appName=${process.env.DB_APP_NAME}`;
const collectionName = 'jobs';

export async function getAllJobs(): Promise<Job[]> {
  const client = new MongoClient(url);

  try {
    await client.connect();
    const db = client.db('job-hunter');
    const collection = db.collection<Job>(collectionName);

    const documents = await collection.find({}).toArray();
    // Convert MongoDB documents to plain JavaScript objects
    return JSON.parse(JSON.stringify(documents));
  } catch (err: any) {
    console.log(err.stack);
    throw new Error(`Failed to get documents from ${collectionName}`);
  } finally {
    await client.close();
  }
}
