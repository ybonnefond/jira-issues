import { GithubUser } from './GithubUser';
import { TimeUtil } from '../TimeUtil';
import { GithubPullRequest } from './GithubPullRequest';

export interface GithubReviewComment {
  url: string;
  pull_request_review_id: number | null;
  id: number;
  node_id: string;
  diff_hunk: string;
  path: string;
  position?: number;
  original_position?: number;
  commit_id: string;
  original_commit_id: string;
  in_reply_to_id?: number;
  user: GithubUser;
  body: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  pull_request_url: string;
  author_association: 'COLLABORATOR' | 'CONTRIBUTOR' | 'FIRST_TIMER' | 'FIRST_TIME_CONTRIBUTOR' | 'MANNEQUIN' | 'MEMBER' | 'NONE' | 'OWNER';
  _links: GithubReviewCommentLinks;
  start_line?: number | null;
  original_start_line?: number | null;
  start_side?: 'LEFT' | 'RIGHT' | null;
  line?: number;
  original_line?: number;
  side?: 'LEFT' | 'RIGHT';
  subject_type?: 'line' | 'file';
  reactions?: GithubReviewCommentReactionRollup;
  body_html?: string;
  body_text?: string;
}

interface GithubReviewCommentLinks {
  self: GithubReviewCommentLink;
  html: GithubReviewCommentLink;
  pull_request: GithubReviewCommentLink;
}

interface GithubReviewCommentLink {
  href: string;
}

interface GithubReviewCommentReactionRollup {
  url: string;
  total_count: number;
  '+1': number;
  '-1': number;
  laugh: number;
  confused: number;
  heart: number;
  hooray: number;
  eyes: number;
  rocket: number;
}
