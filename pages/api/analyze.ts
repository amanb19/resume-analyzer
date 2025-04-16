import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from 'formidable';
import fs from 'fs/promises';
import mammoth from 'mammoth';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err || !files.resume) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const file = Array.isArray(files.resume) ? files.resume[0] : files.resume;
      const buffer = await fs.readFile(file.filepath);

      let content = '';

      if (file.originalFilename?.toLowerCase().endsWith('.docx')) {
        try {
          const { value } = await mammoth.extractRawText({ buffer });
          content = value;
        } catch (docxErr) {
          console.error('⚠️ DOCX Parse Failed:', docxErr);
          return res.status(400).json({ error: 'Unable to parse this .docx file. Please upload a simpler version or a .txt file.' });
        }
      } else {
        content = buffer.toString('utf8');
      }

      const prompt = `
You are a professional resume reviewer.

Analyze the resume below and return a response strictly in this JSON format:

{
  "score": 8,
  "positives": ["point 1", "point 2", "point 3"],
  "improvements": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

Resume:
${content}
`;

      const gptRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY || ''}`,
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!gptRes.ok) {
        const errorText = await gptRes.text();
        console.error('❌ Groq Error:\n', errorText);
        return res.status(500).json({ error: 'Groq API failed' });
      }

      const result = await gptRes.json();
      const output = result.choices?.[0]?.message?.content || '';

      const jsonBlock = output.match(/\{[\s\S]*\}/)?.[0];
      if (!jsonBlock) throw new Error('No valid JSON found in GPT response');

      const parsed = JSON.parse(jsonBlock);

      return res.status(200).json({
        score: parsed.score || 7,
        positives: parsed.positives || [],
        improvements: parsed.improvements || [],
      });
    } catch (e) {
      console.error('GPT Error:', e);
      return res.status(500).json({ error: 'Something went wrong.' });
    }
  });
}
