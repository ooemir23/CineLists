export async function readAnalyticsBody(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; status: 400 | 413 }> {
  const limit = 1024;
  if (Number(request.headers.get("content-length") || 0) > limit) {
    return { ok: false, status: 413 };
  }
  const reader = request.body?.getReader();
  if (!reader) return { ok: false, status: 400 };
  const bytes = new Uint8Array(limit);
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (size + value.byteLength > limit) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      bytes.set(value, size);
      size += value.byteLength;
    }
    return {
      ok: true,
      value: JSON.parse(new TextDecoder().decode(bytes.subarray(0, size))),
    };
  } catch {
    return { ok: false, status: 400 };
  } finally {
    reader.releaseLock();
  }
}
