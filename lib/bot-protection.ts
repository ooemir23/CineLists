const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "fextemp.com",
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamailblock.com",
  "sharklasers.com",
  "grr.la",
  "10minutemail.com",
  "10minutemail.net",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "temp-mail.org",
  "tempmail.com",
  "tempmailo.com",
  "trashmail.com",
  "trashmail.net",
  "getnada.com",
  "dispostable.com",
  "maildrop.cc",
  "mailnesia.com",
  "mohmal.com",
  "fakeinbox.com",
  "throwawaymail.com",
  "vtext.com",
  "txt.att.net",
  "tmomail.net",
  "vzwpix.com",
  "messaging.sprintpcs.com",
  "pm.sprint.com",
  "mypixsys.com",
  "sms.mycricket.com",
  "cspire1.com",
  "email.uscc.net",
  "msg.fi.google.com",
]);

const SPAM_NAME_PATTERNS = [
  /<[a-z!/][\s\S]*>/i,
  /https?:\/\//i,
  /\bwww\.[a-z0-9-]+\.[a-z]{2,}/i,
  /\b[a-z0-9-]+\.(net|com|org|ru|xyz|top|info|biz|click|php)\/[a-z0-9?_=-]*/i,
  /\bdeposit\s+available\b/i,
  /\bhs=[a-f0-9]{16,}\b/i,
  /\*\s*\*\s*\*/,
];

// 5 or more consecutive consonants (excluding Turkish/English vowels and y/Y)
const GIBBERISH_CONSONANT_CLUSTER = /[bcdfghjklmnpqrstvwxzçğşBCDFGHJKLMNPQRSTVWXZÇĞŞ]{5,}/;

export type BotSignalKey =
  | "html_link"
  | "disposable_email"
  | "gmail_dot_trick"
  | "gibberish_name"
  | "no_activity";

export function hasSpamInName(name: string | null | undefined): boolean {
  if (!name) return false;
  const trimmed = name.trim();
  if (!trimmed) return false;
  if (trimmed.length > 70) return true;
  return SPAM_NAME_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function hasGibberishName(name: string | null | undefined): boolean {
  if (!name) return false;
  const cleaned = name.trim();
  if (!cleaned) return false;
  if (/^\d{7,}$/.test(cleaned)) return true;
  return GIBBERISH_CONSONANT_CLUSTER.test(cleaned);
}

export function isDisposableEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  const atIndex = lower.lastIndexOf("@");
  if (atIndex <= 0) return true;
  const local = lower.slice(0, atIndex);
  const domain = lower.slice(atIndex + 1);
  if (local.includes("~") || local.includes("..")) return true;
  return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}

export function isGmailDotTrick(email: string | null | undefined): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  const atIndex = lower.lastIndexOf("@");
  if (atIndex <= 0) return false;
  const local = lower.slice(0, atIndex).split("+")[0];
  const domain = lower.slice(atIndex + 1);
  if (domain !== "gmail.com" && domain !== "googlemail.com") return false;
  const dotCount = (local.match(/\./g) || []).length;
  if (dotCount >= 3) return true;
  if (local.includes("..")) return true;
  return false;
}

export function canonicalizeEmail(email: string): string {
  const lower = email.trim().toLowerCase();
  const atIndex = lower.lastIndexOf("@");
  if (atIndex <= 0) return lower;
  const local = lower.slice(0, atIndex);
  const domain = lower.slice(atIndex + 1);
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const baseLocal = local.split("+")[0].replace(/\./g, "");
    return `${baseLocal}@gmail.com`;
  }
  return lower;
}

export function validateRegistrationBotCheck(input: {
  name: string;
  email: string;
  honeypot?: string | null;
  formLoadedAt?: string | null;
}): { allowed: boolean; reason?: string } {
  if (input.honeypot && String(input.honeypot).trim().length > 0) {
    return { allowed: false, reason: "honeypot" };
  }

  if (input.formLoadedAt) {
    const loadedMs = Number(input.formLoadedAt);
    const now = Date.now();
    if (!Number.isFinite(loadedMs) || now - loadedMs < 1500 || now - loadedMs > 2 * 60 * 60 * 1000) {
      return { allowed: false, reason: "timing" };
    }
  }

  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@~<>]+@[^\s@~<>]+\.[a-z]{2,}$/i.test(email)) {
    return { allowed: false, reason: "email_format" };
  }

  if (isDisposableEmail(email)) {
    return { allowed: false, reason: "disposable_email" };
  }

  if (isGmailDotTrick(email)) {
    return { allowed: false, reason: "gmail_dot_trick" };
  }

  if (hasSpamInName(input.name)) {
    return { allowed: false, reason: "spam_name" };
  }

  if (hasGibberishName(input.name)) {
    return { allowed: false, reason: "gibberish_name" };
  }

  return { allowed: true };
}

export function evaluateAccountBotSignals(user: {
  name?: string | null;
  username?: string | null;
  email?: string | null;
  hasCompletedOnboarding?: boolean;
  accounts?: { provider: string }[];
  adminProfile?: {
    lastSeenAt?: Date | null;
    totalMinutes?: number | null;
  } | null;
  _count?: {
    watched?: number;
    watchedEpisodes?: number;
    toWatch?: number;
    comments?: number;
    activities?: number;
  };
}): {
  verdict: "bot" | "suspicious" | "human";
  signals: BotSignalKey[];
} {
  const signals: BotSignalKey[] = [];

  if (hasSpamInName(user.name) || hasSpamInName(user.username)) {
    signals.push("html_link");
  }
  if (isDisposableEmail(user.email)) {
    signals.push("disposable_email");
  }
  if (isGmailDotTrick(user.email)) {
    signals.push("gmail_dot_trick");
  }
  if (hasGibberishName(user.name)) {
    signals.push("gibberish_name");
  }

  const hasOAuth = (user.accounts?.length || 0) > 0;
  const totalInteractions =
    (user._count?.watched || 0) +
    (user._count?.watchedEpisodes || 0) +
    (user._count?.toWatch || 0) +
    (user._count?.comments || 0) +
    (user._count?.activities || 0);
  const totalMinutes = user.adminProfile?.totalMinutes || 0;
  const hasRealActivity =
    Boolean(user.hasCompletedOnboarding) ||
    hasOAuth ||
    totalInteractions > 0 ||
    totalMinutes > 0;

  if (signals.length > 0 && !hasRealActivity) {
    signals.push("no_activity");
    return { verdict: "bot", signals };
  }

  if (signals.includes("html_link") || signals.includes("disposable_email")) {
    return { verdict: "bot", signals };
  }

  if (!hasRealActivity && !user.adminProfile?.lastSeenAt) {
    signals.push("no_activity");
    return { verdict: "suspicious", signals };
  }

  return { verdict: "human", signals: [] };
}
