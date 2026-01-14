'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Calendar, ChevronLeft, ChevronRight, LogOut, Users, Package, Cpu, Settings, UserRound, CreditCard, ShoppingBag, RotateCcw, Clock, MessageSquare, FileText } from 'lucide-react';
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

  const menuGroups = [
    [
      { id: 'home', name: '홈', icon: Home, path: '/' },
    ],
    [
      { id: 'patients', name: '환자관리', icon: UserRound, path: '/patients' },
      { id: 'reservations', name: '예약', icon: Calendar, path: '/reservations' },
      { id: 'pending', name: '예약대기', icon: Clock, path: '/reservations/pending' },
    ],
    [
      { id: 'payments', name: '결제/수납', icon: CreditCard, path: '/payments' },
      { id: 'refunds', name: '환불관리', icon: RotateCcw, path: '/refunds' },
    ],
    [
      { id: 'services', name: '서비스 관리', icon: ShoppingBag, path: '/services' },
    ],
    [
      { id: 'messaging', name: '메시지 관리', icon: MessageSquare, path: '/messaging' },
      { id: 'consents', name: '동의서 관리', icon: FileText, path: '/consents' },
    ],
    [
      { id: 'hr', name: '인사관리', icon: Users, path: '/hr' },
      { id: 'inventory', name: '재고관리', icon: Package, path: '/inventory' },
      { id: 'equipment', name: '장비관리', icon: Cpu, path: '/equipment' },
    ],
    [
      { id: 'settings', name: '설정', icon: Settings, path: '/settings/operation' },
    ],
  ];

  const allMenuItems = menuGroups.flat();

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
          {menuGroups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {group.map((item) => {
                const Icon = item.icon;
                
                // 정확히 일치하는 경로가 있는지 먼저 확인
                const hasExactMatch = allMenuItems.some(otherItem => pathname === otherItem.path);
                
                // 정확히 일치하는 경로가 있으면 그것만 활성화, 없으면 하위 경로 체크
                const isActive = hasExactMatch 
                  ? pathname === item.path
                  : pathname === item.path || pathname.startsWith(item.path + '/');
                
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
              {groupIndex < menuGroups.length - 1 && !isCollapsed && (
                <div className={styles.groupDivider} />
              )}
            </div>
          ))}
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
