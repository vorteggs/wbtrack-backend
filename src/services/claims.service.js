// services/claims.service.js
import Datastore from 'nedb';

let db;

// Инициализация базы данных
export const initClaimsService = (dbPath) => {
    db = new Datastore({
        filename: dbPath,
        autoload: true
    });

    return {
        findClaim,
        createClaim
    };
};

// Поиск существующей заявки
export const findClaim = (phone, trackNumber) => {
    return new Promise((resolve, reject) => {
        db.findOne(
            {
                phone: phone.replace(/\D/g, ''),
                trackNumber
            },
            (err, claim) => {
                if (err) reject(err);
                else resolve(claim);
            }
        );
    });
};

// Создание новой заявки
export const createClaim = (claimData) => {
    return new Promise((resolve, reject) => {
        const claimToSave = {
            ...claimData,
            phone: claimData.phone.replace(/\D/g, ''),
            recipientPhone: claimData.recipientPhone ?
                claimData.recipientPhone.replace(/\D/g, '') : '',
            claimNumber: `CL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            status: 'new',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        db.insert(claimToSave, (err, newDoc) => {
            if (err) reject(err);
            else resolve(newDoc);
        });
    });
};