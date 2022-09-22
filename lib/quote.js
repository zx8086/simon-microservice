const axios = require("axios")

async function getQuote() {
const result = await axios({
method: "GET",
url: "https://programming-quotes-api.herokuapp.com/quotes/random",
})
return result
}

module.exports = { getQuote }
