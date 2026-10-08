import { LoginFormClient } from "./LoginFormClient";

export async function LoginForm({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  return <LoginFormClient next={typeof sp.next === "string" ? sp.next : "/admin"} />;
}
