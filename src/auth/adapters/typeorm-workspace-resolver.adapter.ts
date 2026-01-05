import { DataSource } from "typeorm";
import { User } from "../../users/user.entity";
import { Workspace } from "../../workspaces/workspace.entity";
import { WorkspaceMember } from "../../workspaces/workspace.entity";
import { WorkspaceContext, WorkspaceResolver } from "../ports/workspace-resolver.port";

export class TypeOrmWorkspaceResolverAdapter
  implements WorkspaceResolver
{
  constructor(private readonly dataSource: DataSource) {}

  async resolve(authOrganizationId: string, user: User): Promise<WorkspaceContext> {
    const workspaceRepo = this.dataSource.getRepository(Workspace);
    const memberRepo = this.dataSource.getRepository(WorkspaceMember);

    let workspace = await workspaceRepo.findOne({
      where: { authOrganizationId },
    });

    if (!workspace) {
      workspace = workspaceRepo.create({
        authOrganizationId,
        name: 'Workspace',
      });
      await workspaceRepo.save(workspace);
    }

    let membership = await memberRepo.findOne({
      where: {
        user: { id: user.id },
        workspace: { id: workspace.id },
      },
      relations: ['user', 'workspace'],
    });

    if (!membership) {
      membership = memberRepo.create({
        user,
        workspace,
        role: 'member',
      });
      await memberRepo.save(membership);
    }

    return {
      workspace,
      role: membership.role,
    };
  }
}
