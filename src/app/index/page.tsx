import { requirePermission } from "@/lib/auth/require-permission";

export default async function IndexPage() {
  await requirePermission("index:view");
  return (
    <main>
      <h1>Home</h1>
      <p>Welcome to Secure HR Portal</p>
    </main>
  );
}
