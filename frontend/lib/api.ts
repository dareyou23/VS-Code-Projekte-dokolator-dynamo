// EXAKTE KOPIE vom Meden-Manager, angepasst für Dokolator

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface User {
  id: string;
  email: string;
  rolle: 'admin' | 'user';
  aktiv: boolean;
  passwordChangeRequired?: boolean;
}

const API_BASE_URL = 'https://7rfvjbcze2.execute-api.eu-central-1.amazonaws.com/Prod';

export class ApiClient {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      this.refreshToken = localStorage.getItem('refresh_token');
      const expiresAt = localStorage.getItem('token_expires_at');
      this.tokenExpiresAt = expiresAt ? parseInt(expiresAt) : 0;
    }
  }

  private async ensureValidToken(): Promise<void> {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (this.token && this.tokenExpiresAt > now + fiveMinutes) {
      return;
    }

    if (this.refreshToken) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: this.refreshToken })
        });

        const data = await response.json();
        
        if (data.success && data.data) {
          this.token = data.data.accessToken;
          this.refreshToken = data.data.refreshToken;
          this.tokenExpiresAt = Date.now() + (data.data.expiresIn * 1000);
          
          if (typeof window !== 'undefined' && this.token && this.refreshToken) {
            localStorage.setItem('auth_token', this.token);
            localStorage.setItem('refresh_token', this.refreshToken);
            localStorage.setItem('token_expires_at', this.tokenExpiresAt.toString());
          }
        } else {
          this.clearTokens();
        }
      } catch (error) {
        console.error('Token refresh failed:', error);
        this.clearTokens();
      }
    }
  }

  private clearTokens(): void {
    this.token = null;
    this.refreshToken = null;
    this.tokenExpiresAt = 0;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expires_at');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    await this.ensureValidToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    if (response.status === 401 && this.refreshToken) {
      await this.ensureValidToken();
      
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
        return await retryResponse.json();
      }
    }
    
    return data;
  }

  async login(email: string, password: string): Promise<ApiResponse<{ token: string; accessToken?: string; refreshToken?: string; expiresIn?: number; user: User }>> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success && data.data) {
      this.token = data.data.accessToken || data.data.token;
      this.refreshToken = data.data.refreshToken || null;
      const expiresIn = data.data.expiresIn || 3600;
      this.tokenExpiresAt = Date.now() + (expiresIn * 1000);
      
      if (typeof window !== 'undefined' && this.token) {
        localStorage.setItem('auth_token', this.token);
        if (this.refreshToken) {
          localStorage.setItem('refresh_token', this.refreshToken);
        }
        localStorage.setItem('token_expires_at', this.tokenExpiresAt.toString());
        localStorage.setItem('currentUser', JSON.stringify(data.data.user));
      }
    }

    return data;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout-Request fehlgeschlagen', error);
    }
    this.clearTokens();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
    }
  }

  getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return this.token !== null;
  }

  // Spieltag API
  async createSpieltag(data: { date: string; startgeld: number; punktwert: number; playerNames: string[] }) {
    return this.request('/spieltage', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listSpieltage() {
    return this.request('/spieltage');
  }

  async getSpieltag(spieltagId: string) {
    return this.request(`/spieltage/${spieltagId}`);
  }

  async completeSpieltag(spieltagId: string) {
    return this.request(`/spieltage/${spieltagId}/complete`, { method: 'PUT' });
  }

  async updateEntnahme(spieltagId: string, entnahme: number) {
    return this.request(`/spieltage/${spieltagId}/entnahme`, {
      method: 'PUT',
      body: JSON.stringify({ entnahme }),
    });
  }

  // Game API
  async addGame(spieltagId: string, gameData: any) {
    return this.request(`/spieltage/${spieltagId}/games`, {
      method: 'POST',
      body: JSON.stringify(gameData),
    });
  }

  async updateGame(spieltagId: string, gameId: string, gameData: any) {
    return this.request(`/spieltage/${spieltagId}/games/${gameId}`, {
      method: 'PUT',
      body: JSON.stringify(gameData),
    });
  }

  async deleteGame(spieltagId: string, gameId: string) {
    return this.request(`/spieltage/${spieltagId}/games/${gameId}`, { method: 'DELETE' });
  }

  async listGames(spieltagId: string) {
    return this.request(`/spieltage/${spieltagId}/games`);
  }

  // Stats API
  async getStats() {
    return this.request('/stats');
  }

  async getSpieltagStats(spieltagId: string) {
    return this.request(`/spieltage/${spieltagId}/stats`);
  }

  // User Management
  async createUser(email: string, password: string, rolle: 'admin' | 'user') {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify({ email, password, rolle }),
    });
  }

  async listUsers(rolle?: 'admin' | 'user') {
    const url = rolle ? `/users?rolle=${rolle}` : '/users';
    return this.request(url);
  }

  async updateUser(userId: string, email: string) {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ email }),
    });
  }

  async deleteUser(userId: string) {
    return this.request(`/users/${userId}`, { method: 'DELETE' });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async resetPassword(email: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }
}

export const apiClient = new ApiClient();
export const api = apiClient; // Alias for backwards compatibility
