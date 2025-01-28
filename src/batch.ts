import { setTimeout } from 'timers/promises';

export async function batch<TItems>({ load, process, batchSize }: { batchSize: number; load: (params: { startAt: number; batchSize: number; page: number }) => Promise<Array<TItems>>; process: (items: Array<TItems>) => void }): Promise<void> {
  let startAt = 0;
  let total = 0;
  let page = 0;

  while (true) {
    const items = await load({ startAt, batchSize, page });

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
