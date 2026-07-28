'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Calendar, Users, MessageSquare, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import Sidebar from './Sidebar';

const primaryTabs = [
  { href: '/portal', label: 'Inicio', icon: Home },
  { href: '/portal/cursos', label: 'Cursos', icon: BookOpen },
  { href: '/portal/actividades', label: 'Actividades', icon: Calendar },
  { href: '/portal/proyectos', label: 'Proyectos', icon: Users },
  { href: '/portal/mensajes', label: 'Mensajes', icon: MessageSquare },
];

interface BottomNavProps {
  userName?: string;
  userEmail?: string;
  onLogout: () => void;
}

export default function BottomNav({ userName, userEmail, onLogout }: BottomNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t bg-card pb-safe">
        {primaryTabs.map((t) => {
          const Icon = t.icon;
          const isActive = t.href === '/portal' ? pathname === '/portal' : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="size-5" />
              {t.label}
            </Link>
          );
        })}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center gap-0.5 px-3 py-2 text-xs text-muted-foreground"
              onClick={() => setOpen(true)}
            >
              <MoreHorizontal className="size-5" />
              Más
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="p-0">
            <Sidebar userName={userName} userEmail={userEmail} onLogout={onLogout} />
          </SheetContent>
        </Sheet>
      </nav>
      <div className="h-16" />
    </>
  );
}
