import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pwzTrackController } from './controllers/pwz-track.controller.js';
import { claimsController } from './controllers/claims.controller.js';
import { dadataController } from './controllers/dadata.controller.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000'
}));
app.use(express.json());

app.post('/api/checkParcel', pwzTrackController.checkParcel);
app.post('/api/createClaim', claimsController.create)
app.post('/api/getBankName', dadataController.getBankName)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});