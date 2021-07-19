import { Fleet } from "./fleet";

type Task<T> = (fleet: Fleet) => Promise<T>;

/**
 * Run task with `n` instances of IPFS. Stop the instances after the task is done.
 */
export async function withFleet<T>(n: number, extendOrTask: Task<T>): Promise<T>;
export async function withFleet<T>(n: number, extendOrTask: Record<string, unknown>, task: Task<T>): Promise<T>;
export async function withFleet<T>(
  n: number,
  extendOrTask: Record<string, unknown> | Task<T>,
  task?: Task<T>
): Promise<T> {
  let extend: Record<string, unknown>;
  let actualTask: Task<T>;
  if (typeof extendOrTask == "function") {
    extend = {};
    actualTask = extendOrTask;
  } else {
    extend = extendOrTask;
    if (task) {
      actualTask = task;
    } else {
      throw new Error(`Task is not provided`);
    }
  }
  const fleet = await Fleet.build(n, extend);
  try {
    return await actualTask(fleet);
  } finally {
    await fleet.stop();
  }
}
