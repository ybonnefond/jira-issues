import { GithubUser } from './GithubUser';

export type GithubSearchPullRequest = {
  id: string;
  url: string;
  html_url: string;
  repository_url: string;
  comments_url: string;
  title: string;
  number: number;
  author: string;
  comments: number;
  created_at: Date;
  updated_at: Date;
  closedAt: Date | null;
  user: GithubUser;
};
