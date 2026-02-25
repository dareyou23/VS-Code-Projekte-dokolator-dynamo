export interface User {
  PK: string;                     // USER#{userId}
  SK: string;                     // PROFILE
  GSI1PK: string;                 // EMAIL#{email}
  GSI1SK: string;                 // USER
  
  id: string;
  email: string;
  password: string;               // bcrypt hash
  rolle: 'admin' | 'user';
  aktiv: boolean;
  passwordChangeRequired: boolean;
  
  createdAt: string;
  updatedAt: string;
  entityType: 'USER';
}

export interface UserProfile {
  id: string;
  email: string;
  rolle: 'admin' | 'user';
  aktiv: boolean;
  passwordChangeRequired: boolean;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}
