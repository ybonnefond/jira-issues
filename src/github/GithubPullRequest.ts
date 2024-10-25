import { GithubUser } from './GithubUser';
import { TimeUtil } from '../TimeUtil';
import {PullRequestProps} from "../entities/PullRequest";

export type GithubPullRequest = {
  url: string;
  id: number;
  html_url: string;
  number: number;
  state: 'closed';
  title: string;
  user: GithubUser;
  body: string;
  created_at: string;
  updated_at: string;
  closed_at: string;
  merged_at: string;
  draft: boolean;
  head: {
    label: string;
    ref: string;
    sha: string;
    user: GithubUser;
  };
  base: {
    label: string;
    ref: string;
    sha: string;
    user: GithubUser;
    repo: {
      id: number;
      name: string;
      full_name: string;
      private: boolean;
      html_url: string;
    };
  };
  merged: boolean;
  merged_by: GithubUser;
  comments: number;
  review_comments: number;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
};

export function mapGithubPrToRow({ pr, author, repository }: { pr: GithubPullRequest; author: string; repository: string }): PullRequestProps {
  const createdAt = new Date(pr.created_at);
  const updatedAt = new Date(pr.updated_at);
  const closedAt = pr.closed_at ? new Date(pr.closed_at) : null;

  const leadTimeMs = closedAt ? closedAt.getTime() - createdAt.getTime() : null;
  const businessLeadTimeMs = closedAt ? TimeUtil.getBusinessDurationMs({ start: createdAt, end: closedAt }) : null;

  const countComments = pr.comments ?? 0;
  const countReviewComments = pr.review_comments ?? 0;
  const additions = pr.additions ?? 0;
  const deletions = pr.deletions ?? 0;
  const changedFiles = pr.changed_files ?? 0;
  const commits = pr.commits ?? 0;

  return {
    id: pr.id,
    url: pr.url,
    title: pr.title,
    number: pr.number,
    link: pr.html_url,
    author,
    repository,
    createdAt: TimeUtil.toDate(createdAt),
    createdAtWeek: TimeUtil.toWeekOfYear(createdAt),
    createdAtMonth: TimeUtil.toMonthOfYear(createdAt),
    createdAtQuarter: TimeUtil.toQuarterOfYear(createdAt),
    updatedAt: TimeUtil.toDate(updatedAt),
    updatedAtWeek: TimeUtil.toWeekOfYear(updatedAt),
    updatedAtMonth: TimeUtil.toMonthOfYear(updatedAt),
    updatedAtQuarter: TimeUtil.toQuarterOfYear(updatedAt),
    closedAt: TimeUtil.toDate(closedAt),
    closedAtWeek: TimeUtil.toWeekOfYear(closedAt),
    closedAtMonth: TimeUtil.toMonthOfYear(closedAt),
    closedAtQuarter: TimeUtil.toQuarterOfYear(closedAt),
    countComments: countComments,
    countReviewComments: countReviewComments,
    totalComments: countComments + countReviewComments,
    additions: additions,
    deletions: deletions,
    changed_files: changedFiles,
    commits: commits,
    leadTimeMs,
    leadTimeDays: leadTimeMs ? TimeUtil.toDurationInRoundedDays24h(leadTimeMs) : null,
    businessLeadTimeMs: businessLeadTimeMs ? TimeUtil.toDurationInRoundedDaysBusinessHours(businessLeadTimeMs) : null,
  };
}
