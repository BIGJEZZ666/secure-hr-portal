export default function AccessDeniedPage() {
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-bold">
        Access Denied
      </h1>
      <p className="mt-3 text-gray-600">
        You do not have permission to access this resource.
      </p>
      <a
        href="/login"
        className="mt-5 inline-block text-blue-700 underline"
      >
        Return to Login
      </a>
    </main>
  );
}
