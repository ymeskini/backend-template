import { AppError } from '../../utils/AppError';
import { Err, Ok } from '../../utils/Result';
import { GithubUserRepository } from '../github-user.repository';

export class RetrieveGithubUserUseCase {
  constructor(private readonly githubUserRepository: GithubUserRepository) {}

  async handle(username: string) {
    try {
      const user = await this.githubUserRepository.findByUsername(username);
      return Ok.of(user);
    } catch (err) {
      return Err.of(err as AppError);
    }
  }
}
