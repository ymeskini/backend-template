import { RetrieveGithubUserUseCase } from '../app/usecases/retrieve-github-user.usecase';
import { GithubUserInMemoryRepository } from '../infra/github-user.inmemory.repository';

describe('RetrieveGithubUserUseCase', () => {
  it('should return a GithubUser', async () => {
    const githubUserRepository = new GithubUserInMemoryRepository();
    const retrieveGithubUserUseCase = new RetrieveGithubUserUseCase(
      githubUserRepository,
    );
    const githubUser = await retrieveGithubUserUseCase.handle('ymeskini');
    expect(githubUser.isOk()).toBe(true);
    if (githubUser.isOk()) {
      expect(githubUser.value.login).toBe('ymeskini');
    }
  });
});
