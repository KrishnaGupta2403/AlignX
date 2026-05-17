import EmployeeLayout from '@/layouts/EmployeeLayout';

export default function EmployeeDashboard() {
  return (
    <EmployeeLayout>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-4">Employee Dashboard</h1>
        <p className="text-white/60">Welcome to your dashboard. Here you can view your goals and reports.</p>
      </div>
    </EmployeeLayout>
  );
}
