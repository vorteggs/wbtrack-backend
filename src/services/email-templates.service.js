// Функции форматирования данных
const formatBirthDate = (dateString) => {
    if (!dateString) return 'Не указана';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
};

const formatPaymentMethod = (method) => {
    const methods = {
        'sbp': 'СБП',
        'card': 'Банковская карта',
        'account': 'Банковский счет'
    };
    return methods[method] || method;
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU');
};

const formatPhone = (phone) => {
    if (!phone) return 'Не указан';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
    }
    return phone;
};

// Генерация HTML для письма с данными заявки
export const generateClaimEmailHTML = (claimData) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Создано новое заявление ${claimData.claimNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f7fa;
        }
        
        .container {
            max-width: 700px;
            margin: 30px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 35px 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 600;
            letter-spacing: -0.5px;
        }
        
        .header .claim-number {
            font-size: 20px;
            opacity: 0.95;
            font-weight: 500;
        }
        
        .content {
            padding: 35px 30px;
        }
        
        .info-section {
            margin-bottom: 10px;
            padding-bottom: 28px;
            border-bottom: 1px solid #eaeaea;
        }
        
        .info-section:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        
        .info-section h3 {
            color: #667eea;
            font-size: 18px;
            margin-bottom: 20px;
            font-weight: 600;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f4ff;
        }
        
        .data-row {
            display: flex;
            margin-bottom: 14px;
            padding: 0;
        }
        
        .data-label {
            flex: 0 0 200px;
            font-weight: 600;
            color: #555;
            padding-right: 15px;
        }
        
        .data-value {
            flex: 1;
            color: #333;
            font-weight: 500;
            word-break: break-word;
        }
        
        .payment-details {
            background: #f8f9ff;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            margin-top: 15px;
        }
        
        .payment-details h4 {
            color: #764ba2;
            margin-bottom: 15px;
            font-size: 16px;
            font-weight: 600;
        }
        
        .payment-details .data-row {
            margin-bottom: 12px;
        }
        
        .payment-details .data-label {
            flex: 0 0 180px;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 1px solid #eaeaea;
            text-align: center;
            color: #777;
            font-size: 13px;
            line-height: 1.5;
        }
        
        @media (max-width: 700px) {
            .container {
                margin: 0;
                border-radius: 0;
            }
            
            .header, .content {
                padding: 25px 20px;
            }
            
            .data-row {
                flex-direction: column;
                margin-bottom: 18px;
            }
            
            .data-label {
                flex: none;
                width: 100%;
                margin-bottom: 4px;
                padding-right: 0;
                font-size: 14px;
            }
            
            .data-value {
                flex: none;
                width: 100%;
                font-size: 14px;
            }
            
            .payment-details .data-row {
                flex-direction: column;
            }
            
            .payment-details .data-label {
                flex: none;
                width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Создано новое заявление</h1>
            <div class="claim-number">Номер: ${claimData.claimNumber}</div>
        </div>
        
        <div class="content">
            <div class="info-section">
                <h3>Основная информация</h3>
                <div class="data-row">
                    <div class="data-label">Дата создания:</div>
                    <div class="data-value">${formatDate(claimData.createdAt)}</div>
                </div>
                <div class="data-row">
                    <div class="data-label">Статус:</div>
                    <div class="data-value">${claimData.status === 'new' ? 'Новый' : claimData.status}</div>
                </div>
                <div class="data-row">
                    <div class="data-label">Трек-номер посылки:</div>
                    <div class="data-value">${claimData.trackNumber}</div>
                </div>
                <div class="data-row">
                    <div class="data-label">Телефон клиента:</div>
                    <div class="data-value">${formatPhone(claimData.phone)}</div>
                </div>
            </div>
            
            <div class="info-section">
                <h3>Личные данные</h3>
                <div class="data-row">
                    <div class="data-label">Фамилия:</div>
                    <div class="data-value">${claimData.lastName || 'Не указана'}</div>
                </div>
                <div class="data-row">
                    <div class="data-label">Имя:</div>
                    <div class="data-value">${claimData.firstName || 'Не указано'}</div>
                </div>
                ${claimData.patronymic ? `
                <div class="data-row">
                    <div class="data-label">Отчество:</div>
                    <div class="data-value">${claimData.patronymic}</div>
                </div>
                ` : ''}
                <div class="data-row">
                    <div class="data-label">Дата рождения:</div>
                    <div class="data-value">${formatBirthDate(claimData.birthDate)}</div>
                </div>
            </div>
            
            <div class="info-section">
                <h3>Документы</h3>
                <div class="data-row">
                    <div class="data-label">Тип документа:</div>
                    <div class="data-value">${claimData.documentType || 'Не указан'}</div>
                </div>
                <div class="data-row">
                    <div class="data-label">Серия паспорта:</div>
                    <div class="data-value">${claimData.passportSeries || 'Не указана'}</div>
                </div>
                <div class="data-row">
                    <div class="data-label">Номер паспорта:</div>
                    <div class="data-value">${claimData.passportNumber || 'Не указан'}</div>
                </div>
            </div>
            
            <div class="info-section">
                <h3>Способ выплаты</h3>
                <div class="data-row">
                    <div class="data-label">Метод выплаты:</div>
                    <div class="data-value">${formatPaymentMethod(claimData.paymentMethod)}</div>
                </div>
                
                ${claimData.paymentMethod === 'sbp' ? `
                <div class="payment-details">
                    <h4>Данные для выплаты через СБП</h4>
                    <div class="data-row">
                        <div class="data-label">Банк:</div>
                        <div class="data-value">${claimData.bankName || 'Не указан'}</div>
                    </div>
                    <div class="data-row">
                        <div class="data-label">Телефон получателя:</div>
                        <div class="data-value">${formatPhone(claimData.recipientPhone)}</div>
                    </div>
                </div>
                ` : ''}
                
                ${claimData.paymentMethod === 'card' && claimData.cardNumber ? `
                <div class="payment-details">
                    <h4>Данные банковской карты</h4>
                    <div class="data-row">
                        <div class="data-label">Номер карты:</div>
                        <div class="data-value">${claimData.cardNumber}</div>
                    </div>
                </div>
                ` : ''}
                
                ${claimData.paymentMethod === 'account' ? `
                <div class="payment-details">
                    <h4>Банковские реквизиты</h4>
                    <div class="data-row">
                        <div class="data-label">БИК банка:</div>
                        <div class="data-value">${claimData.bankBic || 'Не указан'}</div>
                    </div>
                    <div class="data-row">
                        <div class="data-label">Номер счета:</div>
                        <div class="data-value">${claimData.accountNumber || 'Не указан'}</div>
                    </div>
                    <div class="data-row">
                        <div class="data-label">Название банка:</div>
                        <div class="data-value">${claimData.bankName || 'Не указан'}</div>
                    </div>
                </div>
                ` : ''}
            </div>
            
            <div class="footer">
                <p>Это письмо было сгенерировано автоматически. Пожалуйста, не отвечайте на него.</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};