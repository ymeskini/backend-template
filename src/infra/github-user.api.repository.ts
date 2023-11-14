import { GithubUserRepository } from '../app/github-user.repository';
import { GithubUser } from '../domain/github-user';
import { AppError } from '../utils/AppError';

export class GithubUserApiRepository implements GithubUserRepository {
  async findByUsername(username: string) {
    const githubUserRequest = await fetch(
      `https://api.github.com/users/${username}`,
    );
    if (!githubUserRequest.ok) {
      throw new AppError(
        githubUserRequest.statusText,
        githubUserRequest.status,
      );
    }
    return (await githubUserRequest.json()) as GithubUser;
  }
}
