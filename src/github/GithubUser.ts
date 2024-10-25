export type GithubUser = {
  login: string;
  id: number;
  // "node_id": "MDEyOk9yZ2FuaXphdGlvbjI1MDA1NDM3",
  // "avatar_url": "https://avatars.githubusercontent.com/u/25005437?v=4",
  // "gravatar_id": "",
  // "url": "https://api.github.com/users/VoodooTeam",
  // "html_url": "https://github.com/VoodooTeam",
  // "followers_url": "https://api.github.com/users/VoodooTeam/followers",
  // "following_url": "https://api.github.com/users/VoodooTeam/following{/other_user}",
  // "gists_url": "https://api.github.com/users/VoodooTeam/gists{/gist_id}",
  // "starred_url": "https://api.github.com/users/VoodooTeam/starred{/owner}{/repo}",
  // "subscriptions_url": "https://api.github.com/users/VoodooTeam/subscriptions",
  // "organizations_url": "https://api.github.com/users/VoodooTeam/orgs",
  // "repos_url": "https://api.github.com/users/VoodooTeam/repos",
  // "events_url": "https://api.github.com/users/VoodooTeam/events{/privacy}",
  // "received_events_url": "https://api.github.com/users/VoodooTeam/received_events",
  type: 'Organization' | 'User';
  // "site_admin": false
};
