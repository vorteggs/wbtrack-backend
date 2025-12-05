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
export const sendClaimToEmail = async (claimData, pdfBuffer = null) => {
    try {
        const attachments = [];

        if (pdfBuffer) {
            attachments.push({
                filename: `Страховое_заявление_${claimData.claimNumber || 'без_номера'}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            });
        }

        // Генерируем HTML для письма
        const htmlContent = generateClaimEmailHTML(claimData);

        // Создаем письмо
        const mailOptions = {
            from: 'info@intech.insure',
            to: 'sincereapologies@ya.ru',
            attachments: attachments.length > 0 ? attachments : undefined,
            subject: `Создано новое заявление ${claimData.claimNumber}`,
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