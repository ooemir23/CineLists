import { readAnalyticsBody } from "@/lib/admin/request-body";

test("accepts a small analytics body", async () => {
  expect(
    await readAnalyticsBody(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ path: "/search" }),
      }),
    ),
  ).toEqual({ ok: true, value: { path: "/search" } });
});

test("malformed JSON is a client error", async () => {
  expect(
    await readAnalyticsBody(
      new Request("http://localhost", { method: "POST", body: "{" }),
    ),
  ).toEqual({ ok: false, status: 400 });
});

test("stops oversized chunked requests without a content-length header", async () => {
  const cancel = jest.fn();
  const request = new Request("http://localhost", {
    method: "POST",
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(600));
        controller.enqueue(new Uint8Array(600));
      },
      cancel,
    }),
    duplex: "half",
  } as RequestInit);
  expect(await readAnalyticsBody(request)).toEqual({ ok: false, status: 413 });
  expect(cancel).toHaveBeenCalledTimes(1);
});
