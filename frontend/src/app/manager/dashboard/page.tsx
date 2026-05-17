import ManagerLayout from '@/layouts/ManagerLayout';

export default function ManagerDashboard() {
  return (
    <ManagerLayout>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-4">Manager Dashboard</h1>
        <p className="text-white/60">Welcome to your dashboard. Here you can manage your team goals and approvals.</p>
      </div>
    </ManagerLayout>
  );
}
