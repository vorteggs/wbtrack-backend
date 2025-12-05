import PwzTrackService from '../services/pwz-track.service.js';

export const pwzTrackController = {
  async checkParcel(req, res) {
    try {
      const { phone, trackNumber } = req.body;

      const result = await PwzTrackService.checkParcel(phone, trackNumber);
      res.json(result);

    } catch (error) {
      console.error('Check error:', error);
      res.status(500).json({
        error: 'Внутренняя ошибка сервера'
      });
    }
  }
};