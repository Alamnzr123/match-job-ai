import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { Pinecone } from '@pinecone-database/pinecone';
import { v4 as uuidv4 } from 'uuid';

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

  // Initialize Pinecone client
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });
  const indexName = process.env.PINECONE_INDEX!;

  // Ensure uploads directory exists
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const form = formidable({ uploadDir, keepExtensions: true, multiples: false });

  // Wrap formidable parse in a Promise
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

    // Convert text to embedding (OpenAI)
    let embedding: number[] = [];
    try {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: text,
      model: 'text-embedding-ada-002',
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    console.error('OpenAI error:', data);
    return res.status(500).json({ error: data.error?.message || 'Error generating embedding.' });
  }
  embedding = data.data[0].embedding;
} catch (e) {
  console.error('Fetch error:', e);
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
      return res.status(500).json({ error: 'Error saving to Pinecone.' });
    }

    return res.status(200).json({ message: 'CV uploaded and indexed.', vectorId });
  } catch (err) {
    return res.status(500).json({ error: 'Error uploading the file.' });
  }
}