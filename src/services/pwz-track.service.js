import axios from 'axios';

class PwzTrackService {
    constructor() {
        this.apiUrl = 'https://pvz-track-ext-stage.wildberries.ru';
        this.apiKey = 'eyJhbGciOiJFRDI1NTE5In0.eyJpZCI6ICIxMDAwMTciLCAiY2xpZW50X2lkIjogImluZ29zc3RyYWtoIiwgInJlc291cmNlX2lkIjogImluZ29zc3RyYWtoIiwgIm9wIjogeyJ0cmFja2luZyI6IHRydWUsICJwYXJjZWxzIjp0cnVlfX0.qFu4YOLqEiwhXGLw7kz1KsYZqZxR7HMjCKLeyORWgYCiCYeNdtn0rFPvRUpYXpnMmqqtBsbKUY-LRCkPrA1mDQ';
    }

    async checkParcel(phone, trackNumber) {
        const normalizedPhone = phone.replace(/\D/g, '');
        const normalizedTrackNumber = trackNumber;

        const response = await axios.post(
            `${this.apiUrl}/ext/v1/insurance/event_check`,
            {
                phone: normalizedPhone,
                tracking: normalizedTrackNumber
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
        };
    }
}

export default new PwzTrackService();