import { redirect } from "next/navigation";

export default function HomePage() {
  // Middleware handles redirection based on auth cookie, but server component safely falls back
  redirect("/login");
}
