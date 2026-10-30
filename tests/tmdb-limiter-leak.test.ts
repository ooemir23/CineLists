/**
 * Regresyon testi: Canlıda sayfalar ~10 sn sürüp boş dönüyordu, çünkü hiç sonuçlanmayan
 * TMDB istekleri limiter slotlarını (25 adet) kalıcı olarak meşgul ediyordu.
 * Takılan istekler süre dolunca slotu geri vermeli ve sonraki istekler hızlıca çalışmalı.
 */
describe("tmdb.fetch limiter", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    process.env.TMDB_API_KEY = "test-key";
  });

  afterEach(() => {
    jest.useRealTimers();
    global.fetch = originalFetch;
  });

  test("hiç sonuçlanmayan istekler slot sızdırmaz", async () => {
    let hang = true;
    const fetchMock = jest.fn((url: string) => {
      if (hang) return new Promise<Response>(() => {}); // asla çözülmez, sinyali de yok sayar
      return Promise.resolve(
        new Response(JSON.stringify({ id: 1, url }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { tmdb, TMDB_TIMEOUT_MS } = await import("@/lib/tmdb");

    // Limiter kapasitesini (25) aşan sayıda takılan istek
    const stuck = Array.from({ length: 30 }, (_, i) =>
      tmdb.fetch(`/movie/${i}`, { params: { language: "tr-TR" } }),
    );

    await jest.advanceTimersByTimeAsync(TMDB_TIMEOUT_MS + 50);
    // İlk 25'i slot alıp süre dolunca null döner; sıradaki 5'i kapasite hatası alır.
    const stuckResults = await Promise.allSettled(stuck);
    expect(stuckResults.filter((r) => r.status === "fulfilled" && r.value === null)).toHaveLength(25);

    // Slotlar geri verilmiş olmalı: yeni istek beklemeden cevap almalı
    hang = false;
    const fresh = tmdb.fetch("/movie/999", { params: { language: "tr-TR" } });
    await jest.advanceTimersByTimeAsync(10);
    await expect(fresh).resolves.toMatchObject({ id: 1 });
  });

  test("Next.js fetch önbelleği (kilit) atlanır", async () => {
    const fetchMock = jest.fn(() =>
      Promise.resolve(new Response("{}", { status: 200, headers: { "content-type": "application/json" } })),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const { tmdb } = await import("@/lib/tmdb");

    const p = tmdb.fetch("/movie/1", { params: { language: "tr-TR" } });
    await jest.advanceTimersByTimeAsync(10);
    await p;

    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.cache).toBe("no-store");
  });
});
