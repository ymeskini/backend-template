import { GithubUserRepository } from '../github-user.repository';

export class RetrieveGithubUserUseCase {
  constructor(private readonly githubUserRepository: GithubUserRepository) {}

  handle(username: string) {
    return this.githubUserRepository.findByUsername(username);
  }
}
