import { setTimeout } from 'timers/promises';

export type LoadFn<TItems> = (params: { startAt: number; batchSize: number; page: number; nextPageToken?: string }) => Promise<{ items: Array<TItems>; nextPageToken?: string; isLast?: boolean }>;

export async function batch<TItems>({ load, process, batchSize }: { batchSize: number; load: LoadFn<TItems>; process: (items: Array<TItems>) => void }): Promise<void> {
  let startAt = 0;
  let total = 0;
  let page = 0;
  let currentPageToken: string | undefined = undefined;

  while (true) {
    const { items, nextPageToken, isLast } = await load({ startAt, batchSize, page, nextPageToken: currentPageToken });

    currentPageToken = nextPageToken;
    total += items.length;

    await process(items);

    const isComplete = typeof isLast === 'boolean' ? isLast : items.length < batchSize;

    if (isComplete) {
      break;
    }

    startAt += items.length;
    page += 1;

    await setTimeout(100);
  }
}
