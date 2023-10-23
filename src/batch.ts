import { setTimeout } from 'timers/promises';

export async function batch<TItems>({ load, process, batchSize }: { batchSize: number; load: (params: { startAt: number; batchSize: number }) => Promise<Array<TItems>>; process: (items: Array<TItems>) => void }): Promise<void> {
  let startAt = 0;
  let total = 0;

  while (true) {
    const items = await load({ startAt, batchSize });

    total += items.length;

    await process(items);

    if (items.length < batchSize) {
      break;
    }

    startAt += items.length;

    await setTimeout(200);
  }
}
