import { FileText, LayoutDashboard, Settings } from 'lucide-react';
import type { Metadata } from 'next';
import { AppShell } from '@mednet/ui/app-shell';
import { Button } from '@mednet/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@mednet/ui/card';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@mednet/ui/sidebar';

export const metadata: Metadata = { title: 'AppShell' };

const ITEMS = [
  { href: '#dashboard', label: 'Дашборд', icon: LayoutDashboard, active: true },
  { href: '#reports', label: 'Отчёты', icon: FileText, active: false },
  { href: '#settings', label: 'Настройки', icon: Settings, active: false },
];

// Static export: defaultOpen не передаём (cookies() недоступны).
export default function AppShellDemo() {
  return (
    <AppShell
      homeHref="/ui/"
      title="Мониторинг"
      actions={
        <Button size="sm" variant="outline">
          Профиль
        </Button>
      }
      nav={
        <SidebarGroup>
          <SidebarGroupLabel>Разделы</SidebarGroupLabel>
          <SidebarMenu>
            {ITEMS.map(({ href, label, icon: Icon, active }) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton isActive={active} tooltip={label} render={<a href={href} />}>
                  <Icon />
                  <span>{label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Заявок за месяц', '3 553'],
          ['Обработано', '2 918'],
          ['Средний срок', '4,2 дня'],
        ].map(([title, value]) => (
          <Card key={title}>
            <CardHeader>
              <CardDescription>{title}</CardDescription>
              <CardTitle className="text-h3">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
