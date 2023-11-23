import { RetrieveGithubUserUseCase } from './retrieve-github-user.usecase';
import { GithubUserInMemoryRepository } from '../../infra/github-user.inmemory.repository';

describe('RetrieveGithubUserUseCase', () => {
  it('should return a GithubUser', async () => {
    const githubUserRepository = new GithubUserInMemoryRepository();
    const retrieveGithubUserUseCase = new RetrieveGithubUserUseCase(
      githubUserRepository,
    );
    const githubUser = await retrieveGithubUserUseCase.handle('ymeskini');
    expect(githubUser.login).toBe('ymeskini');
  });
});
