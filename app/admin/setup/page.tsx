'use client';

import SetupWizard from '@/components/admin/setup/SetupWizard';
import { SetupProvider } from '@/context/SetupContext';

export default function SetupPage() {
  return (
    <SetupProvider>
      <SetupWizard />
    </SetupProvider>
  );
}
