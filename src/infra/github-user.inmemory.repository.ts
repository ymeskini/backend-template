import { GithubUserRepository } from '../app/github-user.repository';

export class GithubUserInMemoryRepository implements GithubUserRepository {
  findByUsername(username: string) {
    return Promise.resolve({
      login: username,
      id: 30120944,
      node_id: 'MDQ6VXNlcjMwMTIwOTQ0',
      avatar_url: 'https://avatars.githubusercontent.com/u/30120944?v=4',
      gravatar_id: '',
      url: `https://api.github.com/users/${username}`,
      html_url: `https://github.com/${username}`,
      followers_url: `https://api.github.com/users/${username}/followers`,
      following_url: `https://api.github.com/users/${username}/following{/other_user}`,
      gists_url: `https://api.github.com/users/${username}/gists{/gist_id}`,
      starred_url: `https://api.github.com/users/${username}/starred{/owner}{/repo}`,
      subscriptions_url: `https://api.github.com/users/${username}/subscriptions`,
      organizations_url: `https://api.github.com/users/${username}/orgs`,
      repos_url: `https://api.github.com/users/${username}/repos`,
      events_url: `https://api.github.com/users/${username}/events{/privacy}`,
      received_events_url: `https://api.github.com/users/${username}/received_events`,
      type: `User`,
      site_admin: false,
      name: `Youssef Meskini`,
      company: null,
      blog: '',
      location: null,
      email: null,
      hireable: null,
      bio: null,
      twitter_username: null,
      public_repos: 14,
      public_gists: 0,
      followers: 8,
      following: 4,
      created_at: '2017-07-12T14:31:29Z',
      updated_at: '2023-11-06T23:08:13Z',
    });
  }
}
