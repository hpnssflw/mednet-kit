import { act, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SidebarProvider, SidebarRail, useSidebar } from '../components/sidebar.js';
import { createToastManager, Toaster, ToastProvider, ToastViewport } from '../components/toast.js';

function SidebarState() {
  const { state } = useSidebar();
  return <output aria-label="Состояние меню">{state}</output>;
}

describe('SidebarRail', () => {
  it('переключает меню внутри формы без её отправки', async () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form onSubmit={submit}>
        <SidebarProvider>
          <SidebarRail />
          <SidebarState />
        </SidebarProvider>
      </form>,
    );
    const user = userEvent.setup();
    const rail = screen.getByRole('button', { name: 'Показать или скрыть меню' });
    const state = screen.getByRole('status', { name: 'Состояние меню' });

    expect(state).toHaveTextContent('expanded');
    await user.click(rail);
    expect(state).toHaveTextContent('collapsed');
    expect(submit).not.toHaveBeenCalled();

    await user.click(rail);
    expect(state).toHaveTextContent('expanded');
    expect(submit).not.toHaveBeenCalled();
  });
});

describe('Toaster', () => {
  it('объявляет область уведомлений по-русски и позволяет закрыть уведомление', async () => {
    const manager = createToastManager();
    render(<Toaster toastManager={manager} timeout={0} />);
    act(() => {
      manager.add({ title: 'Изменения сохранены', type: 'success' });
    });

    expect(screen.getByRole('region', { name: 'Уведомления' })).toHaveTextContent(
      'Изменения сохранены',
    );
    await userEvent.tab();
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть уведомление' }));
    await waitFor(() => {
      expect(screen.queryByText('Изменения сохранены')).not.toBeInTheDocument();
    });
  });

  it('сохраняет собственное имя области, переданное через ToastViewport', () => {
    render(
      <ToastProvider>
        <ToastViewport aria-label="Системные сообщения" />
      </ToastProvider>,
    );
    expect(screen.getByRole('region', { name: 'Системные сообщения' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Уведомления' })).not.toBeInTheDocument();
  });
});
