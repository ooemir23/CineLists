import { RequestBudget, RequestOverloadError } from "@/lib/request-budget";
test("queue capacity, expiration and slot release remain bounded", async () => {
  jest.useFakeTimers();
  try {
    const queue = new RequestBudget(1, 1);
    const release = await queue.acquire(Date.now() + 1000);
    const waiting = queue.acquire(Date.now() + 500);
    const rejected =
      expect(waiting).rejects.toBeInstanceOf(RequestOverloadError);
    await expect(queue.acquire(Date.now() + 1000)).rejects.toBeInstanceOf(
      RequestOverloadError,
    );
    jest.advanceTimersByTime(501);
    await rejected;
    release();
    release();
    const next = await queue.acquire(Date.now() + 1000);
    next();
  } finally {
    jest.useRealTimers();
  }
});
test("releasing a slot serves an admitted waiter", async () => {
  const queue = new RequestBudget(1, 2);
  const first = await queue.acquire(Date.now() + 1000);
  const waiting = queue.acquire(Date.now() + 1000);
  first();
  const second = await waiting;
  second();
});
