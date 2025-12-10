// services/mail.service.js
import nodemailer from 'nodemailer';
import { generateClaimEmailHTML } from './email-templates.service.js';

// Настройка почтового транспорта
const transporter = nodemailer.createTransport({
    host: 'smtp.msndr.net',
    port: 465,
    secure: true,
    auth: {
        user: 'sincereapologies@ya.ru',
        pass: '9fe69a95866972c2d8574f681b212912'
    }
});

// Отправка уведомления о новой заявке
export const sendClaimToEmail = async (claimData, buffer = null) => {
    try {
        const attachments = [];

        if (buffer) {
            // Определяем тип вложения
            let filename = `Заявление_${claimData.claimNumber || 'без_номера'}`;
            let contentType = 'application/zip';
            
            // Проверяем сигнатуры
            const bufferStr = buffer.toString('binary', 0, 4);
            
            // ZIP сигнатура (PK\x03\x04)
            if (bufferStr.startsWith('PK\x03\x04')) {
                filename += '.zip';
                contentType = 'application/zip';
            } 
            // PDF сигнатура
            else if (bufferStr.startsWith('%PDF')) {
                filename += '.pdf';
                contentType = 'application/pdf';
            }
            
            attachments.push({
                filename: filename,
                content: buffer,
                contentType: contentType
            });
        }

        // Генерируем HTML для письма
        const htmlContent = generateClaimEmailHTML(claimData);

        // Создаем письмо
        const mailOptions = {
            from: 'info@intech.insure',
            to: [
                'sincereapologies@ya.ru',
                'e.bond@intech.insure',
                'e.shapovalov@intech.insure'
            ].join(', '), // Преобразуем массив в строку с разделителем
            attachments: attachments.length > 0 ? attachments : undefined,
            subject: `Создано новое заявление ${claimData.claimNumber || 'без номера'}`,
            html: htmlContent
        };

        // Отправляем письмо
        const info = await transporter.sendMail(mailOptions);
        console.log('Уведомление о заявке отправлено:', info.messageId);

        return info;

    } catch (error) {
        console.error('Ошибка отправки уведомления:', error);
        throw error;
    }
};