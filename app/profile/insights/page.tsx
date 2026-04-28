import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function InsightsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // For now, redirect to own profile insights
  // In the future, this could show a dedicated insights view
  redirect(`/profile/${session.user.id}/insights`);
}
