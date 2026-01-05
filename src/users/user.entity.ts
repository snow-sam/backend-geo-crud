import { Column, Entity, CreateDateColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'auth_user_id', unique: true })
  authUserId: string;

  @CreateDateColumn()
  createdAt: Date;
}
