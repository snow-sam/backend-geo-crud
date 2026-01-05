import { User } from '../../users/user.entity';

export interface UserResolver {
  resolveByAuthUserId(authUserId: string, email: string): Promise<User>;
}
