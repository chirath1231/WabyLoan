import { ContextAwareHeader } from '@/components/wizard/ContextAwareHeader';
import { WizardHost } from '@/components/wizard/WizardHost';
import { TrustFooter } from '@/components/wizard/TrustFooter';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <ContextAwareHeader />
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6">
        <WizardHost />
      </main>
      <TrustFooter />
    </div>
  );
}
