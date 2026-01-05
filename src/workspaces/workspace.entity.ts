import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CreateDateColumn } from "typeorm";
import { User } from "../users/user.entity";

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  authOrganizationId: string;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('workspace_members')
export class WorkspaceMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Workspace)
  workspace: Workspace;

  @Column()
  role: string; // owner | admin | member

  @CreateDateColumn()
  createdAt: Date;
}
