import { GithubUser } from './GithubUser';
import { Review } from '../entities/Review';

export interface GithubReview {
  id: number;
  node_id: string;
  user: GithubUser;
  body: string;
  state: GithubReviewState;
  html_url: string;
  pull_request_url: string;
  _links: Links;
  submitted_at?: string;
  commit_id: string | null;
  body_html?: string;
  body_text?: string;
  author_association: 'COLLABORATOR' | 'CONTRIBUTOR' | 'FIRST_TIMER' | 'FIRST_TIME_CONTRIBUTOR' | 'MANNEQUIN' | 'MEMBER' | 'NONE' | 'OWNER';
}

interface Links {
  html: Link;
  pull_request: Link;
}

interface Link {
  href: string;
}

export enum GithubReviewState {
  APPROVED = 'APPROVED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  COMMENTED = 'COMMENTED',
  DISMISSED = 'DISMISSED',
  PENDING = 'PENDING',
}

export function mapGithubReviewsToStateCount(reviews: Review[]) {
  const reviewStates = Object.values(GithubReviewState).reduce((acc, state) => {
    acc[state] = 0;
    return acc;
  }, {} as Record<GithubReviewState, number>);

  return reviews.reduce((acc, review) => {
    acc[review.getState()] += 1;
    return acc;
  }, reviewStates);
}
