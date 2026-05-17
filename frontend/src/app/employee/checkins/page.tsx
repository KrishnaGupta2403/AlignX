"use client";

import EmployeeLayout from '@/layouts/EmployeeLayout';
import CheckinPage from '@/modules/quarterly-checkins/CheckinPage';

export default function EmployeeCheckinsPage() {
  return (
    <EmployeeLayout>
      <CheckinPage />
    </EmployeeLayout>
  );
}
