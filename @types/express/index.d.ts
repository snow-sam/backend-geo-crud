import 'express';

declare module 'express' {
  export interface Request {
    user?: import('../../src/users/user.entity').User;
    workspace?: import('../../src/workspaces/workspace.entity').Workspace;
    role?: string;
  }
}

