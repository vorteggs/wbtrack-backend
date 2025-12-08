import axios from 'axios';
import { findClaim } from '../services/claims.service.js';

class PwzTrackService {
    constructor() {
        this.apiUrl = 'https://pvz-track-ext-stage.wildberries.ru';
        this.apiKey = 'eyJhbGciOiJFRDI1NTE5In0.eyJpZCI6ICIxMDAwMTciLCAiY2xpZW50X2lkIjogImluZ29zc3RyYWtoIiwgInJlc291cmNlX2lkIjogImluZ29zc3RyYWtoIiwgIm9wIjogeyJ0cmFja2luZyI6IHRydWUsICJwYXJjZWxzIjp0cnVlfX0.qFu4YOLqEiwhXGLw7kz1KsYZqZxR7HMjCKLeyORWgYCiCYeNdtn0rFPvRUpYXpnMmqqtBsbKUY-LRCkPrA1mDQ';
    }

    async checkParcel(phone, trackNumber) {
        const normalizedPhone = phone.replace(/\D/g, '');
        const normalizedTrackNumber = trackNumber;

        const existingClaim = await findClaim(normalizedPhone, normalizedTrackNumber);

        if (existingClaim) {
            return {
                success: true,
                data: existingClaim,
                fromDatabase: true
            };
        }

        console.log(`${this.apiUrl}/ext/v1/insurance/event_check`);
        console.log(phone);

        const response = await axios.post(
            `${this.apiUrl}/ext/v1/insurance/event_check`,
            {
                phone: phone,
                tracking: trackNumber
            },
            {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
            }
        );

        console.log(response.data);

        return {
            success: response.data.status !== 'error',
            data: response.data,
            fromDatabase: false
        };
    }
}

export default new PwzTrackService();