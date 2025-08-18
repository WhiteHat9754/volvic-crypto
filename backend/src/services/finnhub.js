const axios = require('axios');

const API_KEY = process.env.FINNHUB_API_KEY;

const fetchStockQuote = async (symbol) => {
  try {
    const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
      params: { symbol, token: API_KEY },
    });
    return response.data; // { c: ..., h: ..., l: ..., o: ..., pc: ..., t: ... }
  } catch (err) {
    console.error('Finnhub fetch error:', err);
    throw err;
  }
};

module.exports = { fetchStockQuote };
