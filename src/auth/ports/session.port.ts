export interface AuthSession {
    user: {
      id: string;
      email: string;
    };
  }
  
  export interface SessionService {
    getSessionFromRequest(req: Request): Promise<AuthSession | null>;
  }
  