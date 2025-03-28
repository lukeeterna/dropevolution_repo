import axios from "axios";
import { API_BASE_URL } from "./config";

export const getProducts = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/products`);
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero dei prodotti:", error.response?.data || error.message);
    alert("Errore nel recupero dei prodotti. Riprova più tardi.");
    throw error;
  }
};
