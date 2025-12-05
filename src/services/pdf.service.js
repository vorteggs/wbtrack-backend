// services/pdf.service.js
import PdfPrinter from 'pdfmake';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import QRCode from 'qrcode';

// Получаем __dirname для ES модулей
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fonts = {
    Roboto: {
        normal: path.join(__dirname, '../fonts/Times New Roman.ttf'),
        bold: path.join(__dirname, '../fonts/Times New Roman Bold.ttf'),
        italics: path.join(__dirname, '../fonts/Times New Roman.ttf'),
        bolditalics: path.join(__dirname, '../fonts/Times New Roman Bold.ttf')
    }
};

// Создаем printer с вашими шрифтами
const printer = new PdfPrinter(fonts);

// Регистрируем шрифты для Canvas (если нужно)
try {
    const fontPathNormal = path.join(__dirname, '../fonts/Times New Roman.ttf');
    const fontPathBold = path.join(__dirname, '../fonts/Times New Roman Bold.ttf');

    if (fs.existsSync(fontPathNormal)) {
        registerFont(fontPathNormal, { family: 'Times New Roman', weight: 'normal' });
    }

    if (fs.existsSync(fontPathBold)) {
        registerFont(fontPathBold, { family: 'Times New Roman', weight: 'bold' });
    }
} catch (error) {
    console.warn('Не удалось зарегистрировать шрифты для Canvas:', error.message);
}

// Функции форматирования данных
const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    } catch {
        return dateString;
    }
};

const formatPhone = (phone) => {
    if (!phone) return 'Не указан';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
    }
    return phone;
};

const formatPaymentMethod = (method) => {
    const methods = {
        'sbp': 'СБП (Система быстрых платежей)',
        'card': 'Банковская карта',
        'account': 'Банковский счет'
    };
    return methods[method] || method;
};

async function createEnhancedElectronicSignature(claimData) {
    // Параметры canvas - приблизительная ширина области контента для A4
    const scale = 6;
    const displayWidth = 700; // Примерная ширина области контента PDF в пикселях
    const displayHeight = 160; // Увеличиваем высоту для лучшего отображения

    // Создаем canvas
    const canvas = createCanvas(displayWidth * scale, displayHeight * scale);
    const ctx = canvas.getContext('2d');

    // Масштабируем для лучшего качества
    ctx.scale(scale, scale);

    // Фон
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    const primaryColor = '#0046dc';

    // Генерируем QR-код
    let qrCodeDataUrl;
    try {
        const qrCodeText = claimData.claimNumber || `Claim-${Date.now()}`;
        qrCodeDataUrl = await QRCode.toDataURL(qrCodeText, {
            width: 80, // Изменить с 120 на 80
            margin: 1,
            color: {
                dark: primaryColor,
                light: '#ffffff'
            }
        });
    } catch (qrError) {
        console.warn('Не удалось сгенерировать QR-код:', qrError.message);
        qrCodeDataUrl = null;
    }

    // Загружаем герб
    let emblemImage = null;
    try {
        const emblemPath = path.join(__dirname, '../images/herb.png');
        emblemImage = await loadImage(emblemPath);
    } catch (emblemError) {
        console.warn('Не удалось загрузить герб:', emblemError.message);
    }

    // Загружаем QR-код
    let qrCodeImage = null;
    if (qrCodeDataUrl) {
        try {
            qrCodeImage = await loadImage(qrCodeDataUrl);
        } catch (qrImageError) {
            console.warn('Не удалось загрузить QR-код:', qrImageError.message);
        }
    }

    // Разделяем на две равные колонки
    const columnWidth = displayWidth / 2;

    // 1. ЛЕВАЯ КОЛОНКА: ЭЛЕКТРОННАЯ ПОДПИСЬ
    const signatureWidth = 300; // Уменьшить с 300
    const signatureHeight = 140;

    // Центрируем подпись в левой колонке
    const signatureX = (columnWidth - signatureWidth) / 2;
    const signatureY = (displayHeight - signatureHeight) / 2;

    // Рисуем рамку для подписи
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const sigX = signatureX;
    const sigY = signatureY;
    const sigWidth = signatureWidth;
    const sigHeight = signatureHeight;

    const radius = 12;
    ctx.beginPath();
    ctx.moveTo(sigX + radius, sigY);
    ctx.lineTo(sigX + sigWidth - radius, sigY);
    ctx.quadraticCurveTo(sigX + sigWidth, sigY, sigX + sigWidth, sigY + radius);
    ctx.lineTo(sigX + sigWidth, sigY + sigHeight - radius);
    ctx.quadraticCurveTo(sigX + sigWidth, sigY + sigHeight, sigX + sigWidth - radius, sigY + sigHeight);
    ctx.lineTo(sigX + radius, sigY + sigHeight);
    ctx.quadraticCurveTo(sigX, sigY + sigHeight, sigX, sigY + sigHeight - radius);
    ctx.lineTo(sigX, sigY + radius);
    ctx.quadraticCurveTo(sigX, sigY, sigX + radius, sigY);
    ctx.closePath();
    ctx.stroke();

    // Рисуем герб
    if (emblemImage) {
        const emblemX = sigX + 15;
        const emblemY = sigY + 20;
        ctx.drawImage(emblemImage, emblemX, emblemY, 50, 50); // Увеличиваем герб
    } else {
        ctx.fillStyle = '#e3f2fd';
        const emblemX = sigX + 15;
        const emblemY = sigY + 20;
        ctx.fillRect(emblemX, emblemY, 50, 50);
        ctx.fillStyle = primaryColor;
        ctx.font = 'bold 18px "Times New Roman"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('РФ', emblemX + 25, emblemY + 25);
    }

    // Текст подписи
    ctx.fillStyle = primaryColor;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const textX = sigX + 80; // Смещаем текст правее герба
    const textY = sigY + 25;
    const lineHeight = 16;

    ctx.font = 'bold 13px "Times New Roman"';
    ctx.fillText('ДОКУМЕНТ ПОДПИСАН', textX, textY);

    ctx.font = 'bold 13px "Times New Roman"';
    ctx.fillText('ПРОСТОЙ', textX, textY + lineHeight);

    ctx.font = 'bold 13px "Times New Roman"';
    ctx.fillText('ЭЛЕКТРОННОЙ ПОДПИСЬЮ', textX, textY + lineHeight * 2);

    // Нижний текст
    const infoY = textY + lineHeight * 3 + 10;
    ctx.font = '9px "Times New Roman"';
    ctx.fillText('Сертификат: 12345678901234567890', sigX + 15, infoY);
    ctx.fillText('Владелец: ' + (claimData.lastName || 'ФИО'), sigX + 15, infoY + 12);
    ctx.fillText('Действителен: с ' + new Date().toLocaleDateString('ru-RU'), sigX + 15, infoY + 24);

    // 2. ПРАВАЯ КОЛОНКА: QR-КОД
    const qrCodeSize = 80; // Увеличиваем QR-код

    // Центрируем QR-код в правой колонке
    const qrCodeX = columnWidth + (columnWidth - qrCodeSize) / 2;
    const qrCodeY = (displayHeight - qrCodeSize) / 2;

    // Рисуем фон для QR-кода
    ctx.fillStyle = '#ffffffff';
    ctx.fillRect(qrCodeX - 10, qrCodeY - 10, qrCodeSize + 20, qrCodeSize + 20);

    // Рисуем QR-код
    if (qrCodeImage) {
        ctx.drawImage(qrCodeImage, qrCodeX, qrCodeY, qrCodeSize, qrCodeSize);
    } else {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(qrCodeX, qrCodeY, qrCodeSize, qrCodeSize);
        ctx.fillStyle = '#999';
        ctx.font = 'bold 20px "Times New Roman"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QR', qrCodeX + qrCodeSize / 2, qrCodeY + qrCodeSize / 2);
    }

    // Конвертируем в base64
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl;
}

// Генерация PDF документа
export const generateClaimPDF = async (claimData) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Создаем электронную подпись
            const signatureImage = await createEnhancedElectronicSignature(claimData);

            // Создаем документ
            const docDefinition = {
                content: [
                    // Заголовок
                    {
                        text: 'ЗАЯВЛЕНИЕ О СТРАХОВОМ ВОЗМЕЩЕНИИ',
                        style: 'header',
                        margin: [0, 0, 0, 10]
                    },
                    {
                        text: '(ПОТЕРЯ/ПОВРЕЖДЕНИЕ ПОСЫЛКИ)',
                        style: 'subheader',
                        margin: [0, 0, 0, 20]
                    },

                    // Основная информация
                    { text: '1. ОСНОВНАЯ ИНФОРМАЦИЯ', style: 'sectionTitle' },
                    {
                        table: {
                            widths: ['30%', '70%'],
                            body: [
                                ['Дата создания:', formatDate(claimData.createdAt)],
                                ['Номер заявки:', claimData.claimNumber || 'Не указан'],
                                ['Трек-номер посылки:', claimData.trackNumber || 'Не указан'],
                                ['Статус:', 'Новая заявка']
                            ]
                        },
                        style: 'dataTable',
                        margin: [0, 0, 0, 15]
                    },

                    // Личные данные
                    { text: '2. ДАННЫЕ ЗАЯВИТЕЛЯ', style: 'sectionTitle' },
                    {
                        table: {
                            widths: ['30%', '70%'],
                            body: [
                                ['Фамилия:', claimData.lastName || 'Не указана'],
                                ['Имя:', claimData.firstName || 'Не указано'],
                                ['Отчество:', claimData.patronymic || 'Не указано'],
                                ['Дата рождения:', formatDate(claimData.birthDate)],
                                ['Телефон:', formatPhone(claimData.phone)]
                            ]
                        },
                        style: 'dataTable',
                        margin: [0, 0, 0, 15]
                    },

                    // Паспортные данные
                    { text: '3. ПАСПОРТНЫЕ ДАННЫЕ', style: 'sectionTitle' },
                    {
                        table: {
                            widths: ['30%', '70%'],
                            body: [
                                ['Тип документа:', claimData.documentType || 'Не указан'],
                                ['Серия паспорта:', claimData.passportSeries || 'Не указана'],
                                ['Номер паспорта:', claimData.passportNumber || 'Не указан']
                            ]
                        },
                        style: 'dataTable',
                        margin: [0, 0, 0, 15]
                    },

                    // Способ выплаты
                    { text: '4. СПОСОБ ВЫПЛАТЫ ВОЗМЕЩЕНИЯ', style: 'sectionTitle' },
                    {
                        table: {
                            widths: ['30%', '70%'],
                            body: [
                                ['Метод выплаты:', formatPaymentMethod(claimData.paymentMethod)]
                            ]
                        },
                        style: 'dataTable',
                        margin: [0, 0, 0, 10]
                    },

                    // Дополнительные данные в зависимости от способа выплаты
                    ...(claimData.paymentMethod === 'sbp' ? [
                        { text: 'Данные для выплаты через СБП:', style: 'subsection' },
                        {
                            table: {
                                widths: ['30%', '70%'],
                                body: [
                                    ['Банк получателя:', claimData.bankName || 'Не указан'],
                                    ['Телефон получателя:', formatPhone(claimData.recipientPhone)]
                                ]
                            },
                            style: 'dataTable',
                            margin: [0, 0, 0, 15]
                        }
                    ] : []),

                    ...(claimData.paymentMethod === 'card' ? [
                        { text: 'Данные банковской карты:', style: 'subsection' },
                        {
                            table: {
                                widths: ['30%', '70%'],
                                body: [
                                    ['Номер карты:', claimData.cardNumber || 'Не указан']
                                ]
                            },
                            style: 'dataTable',
                            margin: [0, 0, 0, 15]
                        }
                    ] : []),

                    ...(claimData.paymentMethod === 'account' ? [
                        { text: 'Банковские реквизиты:', style: 'subsection' },
                        {
                            table: {
                                widths: ['30%', '70%'],
                                body: [
                                    ['БИК банка:', claimData.bankBic || 'Не указан'],
                                    ['Номер счета:', claimData.accountNumber || 'Не указан'],
                                    ['Название банка:', claimData.bankName || 'Не указан']
                                ]
                            },
                            style: 'dataTable',
                            margin: [0, 0, 0, 15]
                        }
                    ] : []),


                    // Вставляем изображение подписи
                    {
                        image: signatureImage,
                        width: 500, // Уменьшить с 500 до 300-350
                        margin: [10, 100, 0, 20],
                        alignment: 'center'
                    },

                ],

                // Стили документа
                styles: {
                    header: {
                        fontSize: 16,
                        bold: true,
                        alignment: 'center',
                        color: '#2c3e50'
                    },
                    subheader: {
                        fontSize: 14,
                        bold: true,
                        alignment: 'center',
                        color: '#34495e'
                    },
                    sectionTitle: {
                        fontSize: 12,
                        bold: true,
                        margin: [0, 10, 0, 5],
                        color: '#2c3e50'
                    },
                    subsection: {
                        fontSize: 11,
                        bold: true,
                        margin: [0, 5, 0, 5],
                        color: '#34495e'
                    },
                    dataTable: {
                        fontSize: 10,
                        color: '#2c3e50'
                    },
                    disclaimer: {
                        fontSize: 9,
                        color: '#7f8c8d',
                        italics: true
                    },
                    footerNote: {
                        fontSize: 8,
                        color: '#95a5a6',
                        italics: true
                    }
                },

                // Стили по умолчанию
                defaultStyle: {
                    fontSize: 10,
                    font: 'Roboto'
                },

                // Поля страницы
                pageMargins: [40, 40, 40, 40],

            };

            // Создаем PDF
            const pdfDoc = printer.createPdfKitDocument(docDefinition);

            // Собираем буфер
            const chunks = [];
            pdfDoc.on('data', chunk => chunks.push(chunk));
            pdfDoc.on('end', () => {
                const result = Buffer.concat(chunks);
                resolve(result);
            });
            pdfDoc.on('error', reject);

            pdfDoc.end();

        } catch (error) {
            console.error('Ошибка генерации PDF:', error);
            reject(error);
        }
    });
};