import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppShell } from '../layouts/app-shell.js';
import { PublicLayout } from '../layouts/public-layout.js';

describe('PublicLayout', () => {
  it('ссылка «к содержанию», шапка, основное содержимое и подвал', () => {
    render(
      <PublicLayout nav={<a href="/reports">Отчёты</a>}>
        <h1>Страница</h1>
      </PublicLayout>,
    );
    expect(screen.getByRole('link', { name: 'Перейти к содержанию' })).toHaveAttribute(
      'href',
      '#main',
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Страница');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('подвал заменяется целиком', () => {
    render(
      <PublicLayout footer={<footer>Свой подвал</footer>}>
        <p>Текст</p>
      </PublicLayout>,
    );
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Свой подвал');
  });
});

describe('AppShell', () => {
  it('боковая панель, верхняя панель и содержимое', () => {
    render(
      <AppShell
        nav={<p>Навигация</p>}
        title="Отчёты"
        actions={<button type="button">Профиль</button>}
      >
        <p>Таблица</p>
      </AppShell>,
    );
    expect(screen.getByRole('main')).toHaveTextContent('Таблица');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(screen.getByText('Навигация')).toBeInTheDocument();
    expect(screen.getByText('Отчёты')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Профиль' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ЦНИИОИЗ — на главную' })).toHaveAttribute('href', '/');
  });

  it('кнопка меню сворачивает боковую панель', async () => {
    const { container } = render(
      <AppShell nav={<p>Навигация</p>}>
        <p>Таблица</p>
      </AppShell>,
    );
    const sidebar = container.querySelector('[data-slot="sidebar"][data-state]');
    const trigger = container.querySelector('[data-slot="sidebar-trigger"]');
    expect(trigger).toHaveAccessibleName('Показать или скрыть меню');
    expect(sidebar).toHaveAttribute('data-state', 'expanded');
    await userEvent.click(trigger as HTMLElement);
    expect(sidebar).toHaveAttribute('data-state', 'collapsed');
  });

  it('defaultOpen={false} — панель свёрнута сразу', () => {
    const { container } = render(
      <AppShell nav={<p>Навигация</p>} defaultOpen={false}>
        <p>Таблица</p>
      </AppShell>,
    );
    expect(container.querySelector('[data-slot="sidebar"][data-state]')).toHaveAttribute(
      'data-state',
      'collapsed',
    );
  });
});
