export class RequestOverloadError extends Error {
  constructor() {
    super("Request capacity exceeded");
    this.name = "RequestOverloadError";
  }
}
export class RequestBudget {
  private active = 0;
  private queue: Array<{ grant: () => void; reject: () => void }> = [];
  constructor(
    private concurrency = 25,
    private capacity = 100,
  ) {}
  async acquire(deadline: number): Promise<() => void> {
    if (deadline <= Date.now()) throw new RequestOverloadError();
    if (this.active < this.concurrency) this.active++;
    else {
      if (this.queue.length >= this.capacity) throw new RequestOverloadError();
      await new Promise<void>((resolve, reject) => {
        const entry = {
          grant: () => {
            clearTimeout(timer);
            this.active++;
            resolve();
          },
          reject: () => {
            this.queue = this.queue.filter((e) => e !== entry);
            reject(new RequestOverloadError());
          },
        };
        const timer = setTimeout(
          entry.reject,
          Math.max(1, deadline - Date.now()),
        );
        this.queue.push(entry);
      });
    }
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.active--;
      this.queue.shift()?.grant();
    };
  }
}
