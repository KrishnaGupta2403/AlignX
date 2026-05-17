"use client";

import React from 'react';
import ReportDashboard from '@/modules/reporting/ReportDashboard';
import ManagerLayout from '@/layouts/ManagerLayout';

export default function ManagerReportsPage() {
  return (
    <ManagerLayout>
      <ReportDashboard />
    </ManagerLayout>
  );
}
