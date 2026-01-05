import { User } from '../../users/user.entity';
import { Workspace } from '../../workspaces/workspace.entity';

export interface WorkspaceContext {
  workspace: Workspace;
  role: string;
}

export interface WorkspaceResolver {
  resolve(
    authOrganizationId: string,
    user: User,
  ): Promise<WorkspaceContext>;
}
