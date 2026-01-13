'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Calendar, ChevronLeft, ChevronRight, LogOut, Users, Package, Cpu, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Sidebar.module.scss';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const menuItems = [
    { id: 'home', name: '홈', icon: Home, path: '/' },
    { id: 'reservations', name: '예약', icon: Calendar, path: '/reservations' },
    { id: 'hr', name: '인사관리', icon: Users, path: '/hr' },
    { id: 'inventory', name: '재고관리', icon: Package, path: '/inventory' },
    { id: 'equipment', name: '장비관리', icon: Cpu, path: '/equipment' },
    { id: 'settings', name: '설정', icon: Settings, path: '/settings/operation' },
  ];

  useEffect(() => {
      const mainContent = document.querySelector('.main-content') as HTMLElement;
      if (mainContent) {
        mainContent.style.marginLeft = isCollapsed ? '70px' : '200px';
        mainContent.style.maxWidth = isCollapsed ? 'calc(100vw - 70px)' : 'calc(100vw - 200px)';
      }
  }, [isCollapsed]);

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarContent}>
        <nav className={styles.sidebarNav}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <Link
                key={item.id}
                href={item.path}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                {isCollapsed ? <Icon size={20} /> : <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button
            className={styles.logoutBtn}
            onClick={handleLogout}
          >
            <LogOut size={15} strokeWidth={2.5} />
            {!isCollapsed && <span>로그아웃</span>}
          </button>

          <button
            className={styles.collapseBtn}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!isCollapsed && <span>메뉴 접기</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
