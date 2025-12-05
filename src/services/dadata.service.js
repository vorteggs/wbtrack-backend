import axios from 'axios'

const token = 'da1e228cd6f67007a5a32123328170e804188a22'

class DadataService {
    async getBankName(bic) {
        try {
            const { data } = await axios.post(
                'https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/bank',
                { query: bic },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Token ${token}`
                    }
                }
            )

            console.log(data)
            
            return data?.suggestions?.[0]?.value || null
        } catch (error) {
            console.error('Ошибка при запросе к DaData:', error.message)
            return '1'
        }
    }
}

export default new DadataService()