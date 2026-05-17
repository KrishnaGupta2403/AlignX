"use client";

import React from 'react';
import ManagerCheckinView from '@/modules/quarterly-checkins/ManagerCheckinView';
import ManagerLayout from '@/layouts/ManagerLayout';

export default function ManagerCheckinsPage() {
  return (
    <ManagerLayout>
      <div className="space-y-8 relative z-10">
        <ManagerCheckinView />
      </div>
    </ManagerLayout>
  );
}
