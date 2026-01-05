import { DataSource, Repository } from 'typeorm';
import { User } from '../../users/user.entity';
import { UserResolver } from '../ports/user-resolver.port';

export class TypeOrmUserResolverAdapter implements UserResolver {
  private readonly repo: Repository<User>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(User);
  }

  async resolveByAuthUserId(
    authUserId: string,
    email: string,
  ): Promise<User> {
    let user = await this.repo.findOne({
      where: { authUserId },
    });

    if (!user) {
      user = this.repo.create({
        authUserId,
        email,
      });

      await this.repo.save(user);
    }

    return user;
  }
}
