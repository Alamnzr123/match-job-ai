import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { Pinecone } from '@pinecone-database/pinecone';
import { v4 as uuidv4 } from 'uuid';
import { execSync } from 'child_process';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
  const indexName = process.env.PINECONE_INDEX!;

  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({ uploadDir, keepExtensions: true, multiples: false });

  const parseForm = () =>
    new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

  try {
    const { files } = await parseForm();

    let file = Array.isArray(files.cv) ? files.cv[0] : files.cv;
    if (!file) {
      return res.status(400).json({ error: 'No CV file uploaded.' });
    }

    let text = '';
    if (file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(file.filepath);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } else if (file.mimetype === 'text/plain') {
      text = fs.readFileSync(file.filepath, 'utf-8');
    } else {
      return res.status(400).json({ error: 'Only PDF and TXT supported in this example.' });
    }

    if (!text.trim()) {
      return res.status(400).json({ error: 'Extracted text is empty.' });
    }

    // Generate a unique ID for this CV
    const vectorId = uuidv4();

    // Get embedding from local Python script
    let embedding: number[] = [];
    try {
      // Escape quotes for shell
      const safeText = text.replace(/"/g, '\\"');
      const result = execSync(`python embed.py "${safeText}"`);
      embedding = JSON.parse(result.toString());
      if (!Array.isArray(embedding) || typeof embedding[0] !== 'number') {
        console.error('Embedding is not a flat array:', embedding);
        return res.status(500).json({ error: 'Embedding format invalid.' });
      }
    } catch (e) {
      console.error('Embedding error:', e);
      return res.status(500).json({ error: 'Error generating embedding.' });
    }

    // Upsert to Pinecone
    try {
      const index = pinecone.Index(indexName);
      await index.upsert([
        {
          id: vectorId,
          values: embedding,
          metadata: { text },
        },
      ]);
    } catch (e) {
      console.error('Pinecone error:', e);
      return res.status(500).json({ error: 'Error saving to Pinecone.' });
    }

    return res.status(200).json({ message: 'CV uploaded and indexed.', vectorId });
  } catch (err) {
    return res.status(500).json({ error: 'Error uploading the file.' });
  }
}