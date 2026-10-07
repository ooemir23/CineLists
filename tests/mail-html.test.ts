jest.mock("resend", () => ({ Resend: jest.fn().mockImplementation(() => ({ emails: { send: jest.fn().mockResolvedValue({ error: null }) } })) }));
import { Resend } from "resend";
import { escapeHtml, safeHtmlUrl } from "@/lib/mail-html";

const oldKey = process.env.RESEND_API_KEY;
let send: jest.Mock;
beforeAll(async () => {
    process.env.RESEND_API_KEY = "test-only-key";
    await import("@/lib/mail");
    send = (Resend as unknown as jest.Mock).mock.results[0].value.emails.send;
});
afterAll(() => { if (oldKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = oldKey; });
test("dynamic email text and attributes are escaped", () => {
    expect(escapeHtml('<img src=x onerror="attack()"> &')).toBe("&lt;img src=x onerror=&quot;attack()&quot;&gt; &amp;");
    expect(safeHtmlUrl('javascript:attack()')).toBe("");
    expect(safeHtmlUrl('https://example.com/\'x')).toBe("");
    expect(safeHtmlUrl('https://example.com/a?x=1&y=2')).toContain("&amp;");
});
test.each(["tr", "en"] as const)("follower and comment HTML escape injected names and preserve %s translations", async locale => {
    const mail = await import("@/lib/mail");
    await mail.sendFollowerEmail({ toEmail: "test@example.com", recipientName: '<img src=x>', followerName: 'Attacker"<script>x</script>', followerId: 'path/"injection', followerImage: 'javascript:alert(1)', locale });
    await mail.sendCommentNotificationEmail({ toEmail: "test@example.com", recipientName: '<img src=x>', commenterName: '<script>attack</script>', commentContent: '<a href="bad">bad</a>', mediaTitle: "Movie", mediaLink: 'javascript:alert(1)', locale });
    const last = send.mock.calls.slice(-2).map((c: any[]) => c[0]);
    for (const message of last) {
        expect(message.html).not.toContain('<script>');
        expect(message.html).not.toContain('<img src=x>');
        expect(message.html).not.toContain('href="javascript:');
        expect(message.html).not.toContain('src="javascript:');
        expect(message.html).toContain('&lt;img src=x&gt;');
    }
    expect(last[0].subject).toContain(locale === "en" ? "started following" : "takip etmeye");
});
