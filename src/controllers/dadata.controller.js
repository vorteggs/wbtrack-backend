import DadataService from "../services/dadata.service.js"


export const dadataController = {

    async getBankName(req, res) {

        const { bic } = req.body

        const result = await DadataService.getBankName(bic)
        res.json(result)

    }

}