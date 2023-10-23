import { inspect } from "util";

export function debug(o: unknown) {
  console.log(inspect(o, { depth: null, colors: true, compact: false }));
}
