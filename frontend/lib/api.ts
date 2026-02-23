// API Client für Dokolator Backend
// API Gateway URL (deployed 19.02.2026)

const API_BASE_URL = 'https://x6qfjkcjzj.execute-api.eu-central-1.amazonaws.com/Prod';

const USER_ID = 'demo-user'; // Temporär, später aus Auth

export const api = {
  async createSpieltag(data: { date: string; startgeld: number; punktwert: number; playerNames: string[] }) {
    const res = await fetch(`${API_BASE_URL}/spieltage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': USER_ID },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async listSpieltage() {
    const res = await fetch(`${API_BASE_URL}/spieltage`, {
      headers: { 'x-user-id': USER_ID },
    });
    return res.json();
  },

  async getSpieltag(spieltagId: string) {
    const res = await fetch(`${API_BASE_URL}/spieltage/${spieltagId}`, {
      headers: { 'x-user-id': USER_ID },
    });
    return res.json();
  },

  async addGame(spieltagId: string, gameData: any) {
    const res = await fetch(`${API_BASE_URL}/spieltage/${spieltagId}/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': USER_ID },
      body: JSON.stringify(gameData),
    });
    return res.json();
  },

  async updateGame(spieltagId: string, gameId: string, gameData: any) {
    const res = await fetch(`${API_BASE_URL}/spieltage/${spieltagId}/games/${gameId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-id': USER_ID },
      body: JSON.stringify(gameData),
    });
    return res.json();
  },

  async getSpieltagStats(spieltagId: string) {
    const res = await fetch(`${API_BASE_URL}/spieltage/${spieltagId}/stats`, {
      headers: { 'x-user-id': USER_ID },
    });
    return res.json();
  },

  async getStats() {
    const res = await fetch(`${API_BASE_URL}/stats`, {
      headers: { 'x-user-id': USER_ID },
    });
    return res.json();
  },
};
