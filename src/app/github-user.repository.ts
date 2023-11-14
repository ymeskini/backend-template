import { GithubUser } from '../domain/github-user';

export interface GithubUserRepository {
  findByUsername(username: string): Promise<GithubUser>;
}
