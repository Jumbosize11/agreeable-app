import express from 'express';
import OpenAI from 'openai';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const btlClient = new OpenAI({
  apiKey: process.env.BTL_API_KEY,
  baseURL: 'https://api.badtheorylabs.com/v1' 
});

// Endpoint 1: Contract Analysis
app.post('/api/analyze', async (req, res) => {
  const { contractText } = req.body;
  if (!contractText) return res.status(400).json({ error: "No text provided." });

  const systemPrompt = `
    You are an elite legal analyst specializing in consumer protection. 
    Analyze the provided contract or terms of service text and break it down for an everyday person.
    You must respond ONLY with a valid JSON object matching this structure:
    {
      "gotchas": ["List item 1 explaining a hidden fee or trap", "List item 2..."],
      "goodToKnow": ["List item 1 explaining user rights or benefits", "List item 2..."],
      "summary": "A brief plain-English overview of what this document is."
    }
  `;

  try {
    const response = await btlClient.chat.completions.create({
      model: "btl-2", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: contractText }
      ],
      temperature: 0.2
    });
    res.json(JSON.parse(response.choices[0].message.content));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to parse document context." });
  }
});

// Endpoint 2: Interactive Context Q&A Sidebar
app.post('/api/chat', async (req, res) => {
  const { contractText, userQuestion, chatHistory } = req.body;
  try {
    const response = await btlClient.chat.completions.create({
      model: "btl-2",
      messages: [
        { role: "system", content: `You are an accessible, friendly legal companion. Answer the user's question accurately using ONLY the contract text provided below as your context ground truth.\n\nCONTRACT:\n${contractText}` },
        ...chatHistory,
        { role: "user", content: userQuestion }
      ],
      temperature: 0.4
    });
    res.json({ answer: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get response." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Agreeable backend live on port ${PORT}`));

