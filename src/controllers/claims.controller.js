// controllers/claimsController.js
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initClaimsService, findClaim, createClaim } from '../services/claims.service.js';
import { sendClaimToEmail } from '../services/mail.service.js';
import { generateClaimPDF } from '../services/pdf.service.js';

// Получаем __dirname для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Инициализируем сервис заявок
const dbPath = join(__dirname, '../data/claims.db');
initClaimsService(dbPath);

export const claimsController = {

    async create(req, res) {
        const normalizedPhone = req.body.phone.replace(/\D/g, '');
        const normalizedTrackNumber = req.body.trackNumber;

        const existingClaim = await findClaim(normalizedPhone, normalizedTrackNumber);

        if (existingClaim) {
            return res.status(409).json({
                error: 'Заявка уже существует',
                claimId: existingClaim._id,
                claimNumber: existingClaim.claimNumber,
                status: existingClaim.status,
                createdAt: existingClaim.createdAt
            });
        }

        const newClaim = await createClaim(req.body);
        const pdfBuffer = await generateClaimPDF(newClaim);

        await sendClaimToEmail(newClaim, pdfBuffer);

        // // Успешный ответ
        res.status(201).json({
            success: true,
            message: 'Заявка успешно создана',
            claimId: newClaim._id,
            claimNumber: newClaim.claimNumber
        });


        // для тестирования пдф
        // res.setHeader('Content-Type', 'application/pdf');
        // res.setHeader('Content-Disposition', 'inline; filename="claim_' + newClaim.claimNumber + '.pdf"');
        // res.send(pdfBuffer);

    }
};