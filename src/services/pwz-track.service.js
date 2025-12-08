import axios from 'axios';

class PwzTrackService {
    constructor() {
        this.apiUrl = 'https://pvz-track-ext-api.wildberries.ru';
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

        let message = ''

        if (response.data.status === 'error' || response.data.price === -1) {
            message = 'Проверьте корректность введенных данных'
        }

        if (response.data.status === 'declined') {
            message = 'Формирование заявления невозможно (заблокировано на стороне сервиса), попробуйте связаться со службой техподдержки'
        }

        return {
            success: message.length ? false : true,
            price: response.data.price,
            message: message
        }

    }

    // return {
    //     success: response.data.status !== 'declined',
    //     data: response.data,
    // };
}

export default new PwzTrackService();