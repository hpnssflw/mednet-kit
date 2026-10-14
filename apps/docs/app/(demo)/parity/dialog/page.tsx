import type { Metadata } from 'next';
import { ParityDialog } from '../parity-dialog';

export const metadata: Metadata = { title: 'Паритет: диалог' };

export default function ParityDialogPage() {
  return (
    <main className="p-8">
      <p className="text-muted-foreground">Фон страницы под диалогом</p>
      <ParityDialog />
    </main>
  );
}
