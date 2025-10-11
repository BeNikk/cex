import axios from "axios";

export const BASE_URL = "http://localhost:3000/api/v1";

export async function getTicker() {
  const res = await axios.get(`${BASE_URL}/tickers`)
  return res.data;
}
