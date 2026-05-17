import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-[#0A0510] text-white flex flex-col items-center justify-center p-4">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-red-400 mb-4">403</h1>
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-white/60 mb-8">
          You do not have permission to view this page. If you believe this is an error, please contact your administrator.
        </p>
        <Link 
          href="/"
          className="bg-[#A855F7] hover:bg-[#8a3fd6] text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Return to Dashboard
        </Link>
      </div>
    </main>
  );
}
