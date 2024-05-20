const axios = require("axios")

async function getQuote() {
    try {
        const response = await axios.get("https://api.quotable.io/random")
        return response.data
    } catch (error) {
        console.log(error)
    }
}

module.exports = { getQuote }
