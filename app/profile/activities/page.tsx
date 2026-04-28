import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function ActivitiesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // For now, redirect to own profile activities
  // In the future, this could show a dedicated activities view
  redirect(`/profile/${session.user.id}/activities`);
}
