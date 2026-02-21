import { redirect } from "next/navigation";

export default function DashboardFeedsRedirect() {
  redirect("/feeds");
}
