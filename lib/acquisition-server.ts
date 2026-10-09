import "server-only";
import { cookies, headers } from "next/headers";
import {
  ACQUISITION_COOKIE,
  DISCOVERY_COOKIE,
  acquisitionProfile,
  readAcquisition,
  discoveryAnswer,
} from "@/lib/acquisition";
export async function registrationAcquisition() {
  const h = await headers(),
    c = await cookies();
  const answer = discoveryAnswer(c.get(DISCOVERY_COOKIE)?.value);
  const source =
    h.get("dnt") === "1" || h.get("sec-gpc") === "1"
      ? {}
      : acquisitionProfile(readAcquisition(c.get(ACQUISITION_COOKIE)?.value));
  return { ...source, ...(answer ? { discoveryAnswer: answer } : {}) };
}
