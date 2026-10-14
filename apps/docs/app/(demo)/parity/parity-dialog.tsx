'use client';

import { Button } from '@mednet/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@mednet/ui/dialog';
import { Input } from '@mednet/ui/input';

export function ParityDialog() {
  return (
    <Dialog defaultOpen>
      <DialogContent data-testid="dialog">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">Заявка на обучение</DialogTitle>
          <DialogDescription>Проверьте данные перед отправкой.</DialogDescription>
        </DialogHeader>
        <Input placeholder="Эл. почта" aria-label="Эл. почта" />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
          <Button>Отправить</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
