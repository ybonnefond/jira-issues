import { setTimeout } from 'timers/promises';

export async function batch<TItems>({
  load,
  process,
  batchSize,
}: {
  batchSize: number;
  load: (params: { startAt: number; batchSize: number; page: number; nextPageToken?: string }) => Promise<{ items: Array<TItems>; nextPageToken?: string }>;
  process: (items: Array<TItems>) => void;
}): Promise<void> {
  let startAt = 0;
  let total = 0;
  let page = 0;
  let currentPageToken: string | undefined = undefined;

  while (true) {
    const { items, nextPageToken } = await load({ startAt, batchSize, page, nextPageToken: currentPageToken });

    currentPageToken = nextPageToken;
    total += items.length;

    await process(items);

    if (items.length < batchSize) {
      break;
    }

    startAt += items.length;
    page += 1;

    await setTimeout(100);
  }
}
