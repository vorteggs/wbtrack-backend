// controllers/claimsController.js
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { sendClaimToEmail } from '../services/mail.service.js';
import { generateClaimPDF } from '../services/pdf.service.js';
import { createHash, randomBytes } from 'crypto';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import JSZip from 'jszip';

// Получаем __dirname для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Инициализируем сервис заявок
const dbPath = join(__dirname, '../data/claims.db');

// Функция для создания sig файла
function createSignatureFile(pdfBuffer, outputPath) {
    // Создаем хэш SHA-256 от содержимого PDF
    const hash = createHash('sha256');
    hash.update(pdfBuffer);
    const signature = hash.digest('hex');

    // Формируем данные для сиг файла
    const signatureData = {
        signature: signature,
        algorithm: 'SHA-256',
        timestamp: new Date().toISOString(),
        file: 'Заявление.pdf'
    };

    // Записываем сигнатуру в файл
    writeFileSync(outputPath, JSON.stringify(signatureData, null, 2));
    return outputPath;
}

// Функция для создания архива с JSZip
async function createDocumentsArchive(pdfBuffer, sigBuffer) {
    try {
        const zip = new JSZip();

        // Добавляем файлы в архив
        zip.file('Заявление.pdf', pdfBuffer);
        zip.file('doc_signed.sig', sigBuffer);

        // Генерируем архив в формате Node.js Buffer
        const zipBuffer = await zip.generateAsync({
            type: "nodebuffer",
            compression: "DEFLATE",
            compressionOptions: { level: 6 }
        });

        return zipBuffer;
    } catch (error) {
        console.error('Ошибка при создании архива с JSZip:', error);
        throw new Error('Не удалось создать архив с документами');
    }
}

export const claimsController = {
    async create(req, res) {
        try {
            const pdfBuffer = await generateClaimPDF(req.body);
            console.log('Данные заявки:', req.body);

            // Генерация номера заявки
            const claimNumber = `CLM-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;

            // Создаем объект заявки
            const newClaim = {
                ...req.body,
                claimNumber: claimNumber,
                createdAt: new Date().toISOString(),
                status: 'new'
            };

            // Создаем временные файлы
            const tempDir = tmpdir();
            const timestamp = Date.now();
            const randomId = randomBytes(4).toString('hex');
            const pdfPath = join(tempDir, `claim_${timestamp}_${randomId}.pdf`);
            const sigPath = join(tempDir, `claim_${timestamp}_${randomId}.sig`);

            try {
                // Сохраняем PDF во временный файл
                writeFileSync(pdfPath, pdfBuffer);

                // Создаем sig файл
                createSignatureFile(pdfBuffer, sigPath);

                // Читаем sig файл
                const sigBuffer = readFileSync(sigPath);

                // Создаем архив с использованием JSZip
                const archiveBuffer = await createDocumentsArchive(pdfBuffer, sigBuffer);

                // Отправляем архив на почту
                await sendClaimToEmail(newClaim, archiveBuffer);

                // Успешный ответ
                res.status(201).json({
                    success: true,
                    message: 'Заявка успешно создана и отправлена на почту',
                    claimNumber: claimNumber,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.error('Ошибка при создании архива:', error);
                // В случае ошибки отправляем только PDF
                await sendClaimToEmail(newClaim, pdfBuffer);

                res.status(201).json({
                    success: true,
                    message: 'Заявка создана, но архив не сформирован. PDF отправлен на почту',
                    claimNumber: claimNumber,
                    timestamp: new Date().toISOString()
                });
            } finally {
                // Очищаем временные файлы
                try {
                    [pdfPath, sigPath].forEach(path => {
                        if (existsSync(path)) {
                            unlinkSync(path);
                        }
                    });
                } catch (cleanupError) {
                    console.error('Ошибка при очистке временных файлов:', cleanupError);
                }
            }

        } catch (error) {
            console.error('Ошибка при создании заявки:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при создании заявки',
                error: error.message
            });
        }
    },

    async getPDF(req, res) {
        try {
            // Генерируем PDF из данных запроса
            const pdfBuffer = await generateClaimPDF(req.body);

            // Формируем имя файла
            const claimNumber = req.body.claimNumber || `claim_${Date.now()}`;
            const filename = `Заявление_${claimNumber}.pdf`;
            const encodedFilename = encodeURIComponent(filename);

            // Устанавливаем заголовки для возврата PDF
            res.setHeader('Content-Type', 'application/pdf');
            // Используем оба варианта для совместимости: ASCII для старых браузеров и UTF-8 для современных
            res.setHeader('Content-Disposition', `inline; filename="Zayavlenie_${claimNumber}.pdf"; filename*=UTF-8''${encodedFilename}`);
            res.setHeader('Content-Length', pdfBuffer.length);

            // Отправляем PDF
            res.send(pdfBuffer);

        } catch (error) {
            console.error('Ошибка при генерации PDF:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при генерации PDF',
                error: error.message
            });
        }
    }
};