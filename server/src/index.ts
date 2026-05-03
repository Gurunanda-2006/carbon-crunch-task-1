import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ingestRouter } from './routes/ingest';
import { eventsRouter } from './routes/events';
import { aggregateRouter } from './routes/aggregate';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Routes
app.use('/api/ingest', ingestRouter);
app.use('/api/events', eventsRouter);
app.use('/api/aggregate', aggregateRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
