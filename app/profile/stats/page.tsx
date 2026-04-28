import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function StatsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // For now, redirect to own profile stats
  // In the future, this could show a dedicated stats view
  redirect(`/profile/${session.user.id}/stats`);
}
