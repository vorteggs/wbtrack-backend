// services/pdf.service.js
import PdfPrinter from 'pdfmake';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import QRCode from 'qrcode';
import crypto from 'crypto';

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

const printer = new PdfPrinter(fonts);

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

const formatDate = (dateString) => {
    if (!dateString) return 'Не указана';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    } catch {
        return dateString;
    }
};

// Функция для форматирования даты в формате "12 октября 2025 г."
const formatDateLong = (dateString) => {
    if (!dateString) return 'Не указана';
    try {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleString('ru-RU', { month: 'long' });
        const year = date.getFullYear();
        return `${day} ${month} ${year} г.`;
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

const getPaymentMethodText = (method) => {
    switch (method) {
        case 'sbp': return 'СБП (Система быстрых платежей)';
        case 'card': return 'Банковская карта';
        case 'account': return 'Безналичный перевод на расчетный счет';
        default: return 'Безналичный перевод на расчетный счет';
    }
};

async function createEnhancedElectronicSignature(claimData) {

    const fullName = [
        claimData.lastName || '',
        claimData.firstName || '',
        claimData.patronymic || ''
    ].filter(Boolean).join(' ');

    // Увеличиваем размер canvas для увеличения подписи и QR-кода
    const scale = 8; // Увеличили scale для лучшего качества
    const displayWidth = 800; // Увеличили ширину
    const displayHeight = 250; // Увеличили высоту

    const canvas = createCanvas(displayWidth * scale, displayHeight * scale);
    const ctx = canvas.getContext('2d');

    ctx.scale(scale, scale);

    // Фон
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Возвращаем синий цвет для рамки и текста
    const primaryColor = '#0046dc';
    const textColor = primaryColor; // Теперь весь текст внутри подписи синий

    // Генерируем QR-код ЧЕРНОГО цвета
    let qrCodeDataUrl;
    try {
        const qrCodeText = claimData.trackNumber || `Claim-${Date.now()}`;
        qrCodeDataUrl = await QRCode.toDataURL(qrCodeText, {
            width: 140, // Увеличили размер QR-кода
            margin: 1,
            color: {
                dark: '#000000', // Черный цвет QR-кода
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

    const columnWidth = displayWidth / 2;

    // 1. ЛЕВАЯ КОЛОНКА: ЭЛЕКТРОННАЯ ПОДПИСЬ
    const signatureWidth = 450; // Увеличили ширину подписи
    const signatureHeight = 230; // Увеличили высоту подписи
    const signatureX = (columnWidth - signatureWidth) / 2 + 50;
    const signatureY = (displayHeight - signatureHeight) / 2;

    // Рисуем рамку для подписи - СИНИЙ цвет
    ctx.strokeStyle = primaryColor; // Синий цвет рамки
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    const sigX = signatureX;
    const sigY = signatureY;
    const sigWidth = signatureWidth;
    const sigHeight = signatureHeight;

    const radius = 20; // Увеличили радиус скругления
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
        const emblemX = sigX + 30; // Увеличили отступ
        const emblemY = sigY + 35; // Увеличили отступ
        ctx.drawImage(emblemImage, emblemX, emblemY, 80, 80); // Увеличили размер герба
    } else {
        ctx.fillStyle = '#e3f2fd';
        const emblemX = sigX + 30;
        const emblemY = sigY + 35;
        ctx.fillRect(emblemX, emblemY, 80, 80);
        ctx.fillStyle = primaryColor; // Синий цвет для текста "РФ"
        ctx.font = 'bold 28px "Times New Roman"'; // Увеличили шрифт
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('РФ', emblemX + 40, emblemY + 40);
    }

    // Текст подписи - СИНИЙ цвет
    ctx.fillStyle = primaryColor; // Синий цвет текста
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const textX = sigX + 130; // Увеличили отступ
    const textY = sigY + 40; // Увеличили отступ
    const lineHeight = 22; // Увеличили межстрочный интервал

    ctx.font = 'bold 18px "Times New Roman"'; // Увеличили шрифт
    ctx.fillText('ДОКУМЕНТ ПОДПИСАН', textX, textY);

    ctx.font = 'bold 18px "Times New Roman"';
    ctx.fillText('ПРОСТОЙ', textX, textY + lineHeight);

    ctx.font = 'bold 18px "Times New Roman"';
    ctx.fillText('ЭЛЕКТРОННОЙ ПОДПИСЬЮ', textX, textY + lineHeight * 2);

    // Нижний текст - ТЕПЕРЬ ТОЖЕ СИНИЙ
    const infoY = textY + lineHeight * 3 + 20;
    ctx.fillStyle = primaryColor; // Теперь синий цвет для информационного текста
    ctx.font = '12px "Times New Roman"'; // Увеличили шрифт
    ctx.fillText(fullName, sigX + 30, infoY);
    ctx.fillText(new Date().toISOString(), sigX + 30, infoY + 16);
    ctx.fillText('Отправка sms с кодом от insuranceclaim на ' + claimData.phone, sigX + 30, infoY + 32);
    ctx.fillText('и ввод кода в форме создания заявления', sigX + 30, infoY + 48);
    ctx.fillText('Hash ЭД: ' + crypto.randomBytes(16).toString('hex'), sigX + 30, infoY + 64);


    // 2. ПРАВАЯ КОЛОНКА: QR-КОД
    const qrCodeSize = 140; // Увеличили размер QR-кода
    const qrCodeX = columnWidth + (columnWidth - qrCodeSize) / 2 + 50;
    const qrCodeY = (displayHeight - qrCodeSize) / 2;

    // Рисуем фон для QR-кода
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrCodeX - 20, qrCodeY - 20, qrCodeSize + 40, qrCodeSize + 40);

    // Рисуем QR-код
    if (qrCodeImage) {
        ctx.drawImage(qrCodeImage, qrCodeX, qrCodeY, qrCodeSize, qrCodeSize);
    } else {
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(qrCodeX, qrCodeY, qrCodeSize, qrCodeSize);
        ctx.fillStyle = textColor;
        ctx.font = 'bold 28px "Times New Roman"'; // Увеличили шрифт
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('QR', qrCodeX + qrCodeSize / 2, qrCodeY + qrCodeSize / 2);
    }

    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl;
}



export const generateClaimPDF = async (claimData) => {
    return new Promise(async (resolve, reject) => {
        try {
            const signatureImage = await createEnhancedElectronicSignature(claimData);

            // Формируем ФИО
            const fullName = [
                claimData.lastName || '',
                claimData.firstName || '',
                claimData.patronymic || ''
            ].filter(Boolean).join(' ');

            // Формируем паспортные данные
            const passportInfo = [
                claimData.passportSeries ? `серия ${claimData.passportSeries}` : '',
                claimData.passportNumber ? `номер ${claimData.passportNumber}` : ''
            ].filter(Boolean).join(', ');

            // Текущая дата в формате "12 октября 2025 г."
            const formattedDate = formatDateLong(new Date());

            // Способ получения возмещения
            const paymentMethodText = getPaymentMethodText(claimData.paymentMethod);

            // Для СБП: используем recipientPhone, если есть, иначе phone
            const sbpPhone = claimData.recipientPhone || claimData.phone || '_____';

            // Создаем документ
            const docDefinition = {
                content: [
                    // Две колонки: данные заявителя и страховой компании
                    {
                        columns: [
                            // Левая колонка - данные заявителя
                            {
                                stack: [
                                    {
                                        text: [
                                            { text: 'От: ' + fullName || '_____', margin: [0, 2, 0, 5], color: '#000000' },
                                            '\nДата рождения: ' + (claimData.birthDate ? formatDate(claimData.birthDate) : '_____'),
                                            '\nКонтактный телефон: ' + (claimData.phone ? formatPhone(claimData.phone) : '_____'),
                                            '\nПаспортные данные: ' + passportInfo,
                                        ],
                                        lineHeight: 1.3,
                                        color: '#000000'
                                    }
                                ],
                                width: '50%'
                            },
                            // Правая колонка - данные страховой компании
                            {
                                stack: [
                                    {
                                        text: [
                                            { text: 'В: СПАО "Ингосстрах"\n', fontSize: 12, color: '#000000' },
                                            '(Отдел урегулирования убытков)\n',
                                            { text: 'Адрес: 115035, город Москва, Пятницкая ул., д.12 стр.2\n', italics: true, color: '#000000' },
                                        ],
                                        lineHeight: 1.3,
                                        alignment: 'right'
                                    }
                                ],
                                width: '50%'
                            }
                        ],
                        margin: [0, 0, 0, 20]
                    },

                    // Заголовок
                    {
                        text: 'ЗАЯВЛЕНИЕ О СТРАХОВОМ ВОЗМЕЩЕНИИ',
                        style: 'header',
                        margin: [0, 0, 0, 5],
                        color: '#000000'
                    },
                    {
                        text: '(ГРУЗОПЕРЕВОЗКИ)',
                        style: 'subheader',
                        margin: [0, 0, 0, 20],
                        color: '#000000'
                    },

                    // Основной текст заявления
                    {
                        text: [
                            'Прошу рассмотреть настоящее заявление о страховом событии, произошедшем ',
                            { text: claimData.eventDate ? formatDateLong(claimData.eventDate) : '_____', bold: true, color: '#000000' },
                            ' во время перевозки отправления с трек-номером ',
                            { text: claimData.trackNumber || '_____', bold: true, color: '#000000' },
                            '. ',
                        ],
                        lineHeight: 1.3,
                        margin: [0, 0, 0, 15],
                        color: '#000000'
                    },

                    // Договор и полис
                    {
                        text: [
                            'Договор перевозки № ',
                            { text: claimData.transportContractNumber || '_____', bold: true, color: '#000000' },
                            ' от ',
                            { text: claimData.transportContractDate ? formatDateLong(claimData.transportContractDate) : '_____', bold: true, color: '#000000' }
                        ],
                        margin: [0, 0, 0, 10],
                        color: '#000000'
                    },
                    {
                        text: [
                            'Страховой полис № ',
                            { text: claimData.policyNumber || '_____', bold: true, color: '#000000' },
                            '.'
                        ],
                        margin: [0, 0, 0, 15],
                        color: '#000000'
                    },

                    // Описание ситуации
                    {
                        text: [
                            'Описание ситуации:\n',
                            { text: claimData.eventDescription || '_____', bold: true, color: '#000000' }
                        ],
                        lineHeight: 1.3,
                        margin: [0, 0, 0, 15],
                        color: '#000000'
                    },

                    // Сумма ущерба
                    {
                        text: [
                            'Заявленная сумма ущерба: ',
                            { text: claimData.price ? `${claimData.price} руб.` : '_____ руб.', bold: true, color: '#000000' }
                        ],
                        margin: [0, 0, 0, 15],
                        color: '#000000'
                    },

                    // Способ получения возмещения
                    {
                        text: [
                            'Способ получения возмещения: ',
                            { text: paymentMethodText, bold: true, color: '#000000' }
                        ],
                        margin: [0, 0, 0, 20],
                        color: '#000000'
                    },

                    // Платежные реквизиты
                    {
                        text: 'Платежные реквизиты:',
                        style: 'sectionHeader',
                        margin: [0, 0, 0, 10],
                        color: '#000000'
                    },

                    // Реквизиты для банковского счета
                    ...(claimData.paymentMethod === 'account' ? [
                        { text: 'Расчетный счет: ' + (claimData.accountNumber || '_____'), margin: [0, 0, 0, 5], color: '#000000' },
                        { text: 'Банк получателя: ' + (claimData.bankName || '_____'), margin: [0, 0, 0, 5], color: '#000000' },
                        { text: 'БИК: ' + (claimData.bankBic || '_____'), margin: [0, 0, 0, 5], color: '#000000' },
                    ] : []),

                    // Реквизиты для карты
                    ...(claimData.paymentMethod === 'card' ? [
                        {
                            columns: [
                                { text: 'Получатель:', width: '30%', color: '#000000' },
                                { text: fullName || '_____', width: '70%', decoration: 'underline', color: '#000000' }
                            ],
                            margin: [0, 0, 0, 5]
                        },
                        { text: 'Номер карты: ' + (claimData.cardNumber || '_____'), margin: [0, 0, 0, 5], color: '#000000' }
                    ] : []),

                    // Реквизиты для СБП
                    ...(claimData.paymentMethod === 'sbp' ? [
                        {
                            columns: [
                                { text: 'Получатель:', width: '30%', color: '#000000' },
                                { text: fullName || '_____', width: '70%', decoration: 'underline', color: '#000000' }
                            ],
                            margin: [0, 0, 0, 5]
                        },
                        { text: 'Телефон получателя: ' + (sbpPhone ? formatPhone(sbpPhone) : '_____'), margin: [0, 0, 0, 5], color: '#000000' },
                        { text: 'Банк получателя: ' + (claimData.bankName || '_____'), margin: [0, 0, 0, 5], color: '#000000' }
                    ] : []),

                    { text: '\n', margin: [0, 0, 0, 15] },

                    // Подпись и дата
                    {
                        columns: [
                            {
                                stack: [
                                    {
                                        text: [
                                            'С уважением, ',
                                            { text: '_____', bold: true, color: '#000000' },
                                            ' / ',
                                            { text: fullName, bold: true, color: '#000000' },
                                            '\n\n',
                                            { text: '    (Подпись)', italics: true, fontSize: 9, color: '#000000' },
                                            { text: '    (Расшифровка подписи)', italics: true, fontSize: 9, color: '#000000' }
                                        ]
                                    }
                                ],
                                width: '70%'
                            },
                            {
                                stack: [
                                    {
                                        text: [
                                            'Дата: ',
                                            { text: formattedDate, bold: true, color: '#000000' }
                                        ],
                                        alignment: 'right'
                                    }
                                ],
                                width: '30%'
                            }
                        ],
                        margin: [0, 0, 0, 40]
                    },

                    // Электронная подпись (увеличили ширину)
                    {
                        image: signatureImage,
                        width: 500, // Увеличили ширину подписи в PDF
                        margin: [100, 20, 0, 0],
                        alignment: 'center'
                    }
                ],

                styles: {
                    header: {
                        fontSize: 16,
                        bold: true,
                        alignment: 'center',
                        color: '#000000'
                    },
                    subheader: {
                        fontSize: 14,
                        bold: true,
                        alignment: 'center',
                        color: '#000000'
                    },
                    sectionHeader: {
                        fontSize: 12,
                        bold: true,
                        color: '#000000'
                    }
                },

                defaultStyle: {
                    fontSize: 11,
                    font: 'Roboto',
                    lineHeight: 1.0,
                    color: '#000000'
                },

                pageMargins: [40, 40, 40, 40],
            };

            const pdfDoc = printer.createPdfKitDocument(docDefinition);

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