import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const openai = new OpenAI({
    apiKey: process.env.BTL_API_KEY || 'gw_btl-hack_0571cc8224d5dfbf0d611e5340e3a1b31e41bb9d39f65d66',
    baseURL: 'https://runtime.badtheorylabs.com/v1'
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { text } = req.body;
        const completion = await openai.chat.completions.create({
            model: 'btl-2',
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert legal analyst. Analyze the provided contract and respond with a raw JSON object containing exactly three keys: "summary" (string overview), "gotchas" (array of dangerous/hidden clauses), and "rights" (array of user protections). Do not wrap the JSON in markdown blocks.'
                },
                { role: 'user', content: text }
            ]
        });
        
        return res.json(JSON.parse(completion.choices[0].message.content));
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { messages, documentText } = req.body;
        const completion = await openai.chat.completions.create({
            model: 'btl-2',
            messages: [
                {
                    role: 'system',
                    content: `You are an interactive legal assistant cross-examining this document: ${documentText}. Answer user questions using ONLY facts from this text.`
                },
                ...messages
            ]
        });
        return res.json({ message: completion.choices[0].message.content });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Agreeable backend live on port ${PORT}`));
