import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CNIIOIZ, SiteFooter } from '../brand/site-footer.js';
import { SiteHeader } from '../brand/site-header.js';

describe('SiteHeader', () => {
  it('логотип ведёт на главную, навигация и действия на месте', () => {
    render(
      <SiteHeader
        homeHref="/start"
        nav={<a href="/about">О нас</a>}
        actions={<button type="button">Войти</button>}
      />,
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ЦНИИОИЗ — на главную' })).toHaveAttribute(
      'href',
      '/start',
    );
    expect(screen.getByRole('navigation', { name: 'Основная навигация' })).toContainElement(
      screen.getByRole('link', { name: 'О нас' }),
    );
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument();
  });

  it('без nav нет пустого ориентира навигации', () => {
    render(<SiteHeader />);
    expect(screen.getByRole('link', { name: 'ЦНИИОИЗ — на главную' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('navigation')).toBeNull();
  });
});

describe('SiteFooter', () => {
  it('реквизиты ЦНИИОИЗ по умолчанию', () => {
    render(<SiteFooter year={2026} />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent(CNIIOIZ.fullName);
    expect(footer).toHaveTextContent('© 2026 ФГБУ «ЦНИИОИЗ» Минздрава России');
    expect(screen.getByRole('link', { name: '+7 (495) 618-31-83' })).toHaveAttribute(
      'href',
      'tel:+74956183183',
    );
    expect(screen.getByRole('link', { name: 'mail@mednet.ru' })).toHaveAttribute(
      'href',
      'mailto:mail@mednet.ru',
    );
  });

  it('год по умолчанию — текущий', () => {
    render(<SiteFooter />);
    expect(screen.getByRole('contentinfo')).toHaveTextContent(`© ${new Date().getFullYear()}`);
  });

  it('реквизиты переопределяются и скрываются, ссылки — отдельный ориентир', () => {
    render(
      <SiteFooter
        orgName="Проектный офис"
        phone={null}
        email="office@example.ru"
        links={<a href="/privacy">Политика конфиденциальности</a>}
      />,
    );
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Проектный офис');
    expect(screen.queryByRole('link', { name: /\+7/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'office@example.ru' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Дополнительные ссылки' })).toContainElement(
      screen.getByRole('link', { name: 'Политика конфиденциальности' }),
    );
  });
});
