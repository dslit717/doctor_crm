'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import './Sidebar.scss';

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { id: 'home', name: '홈', icon: Home, path: '/' },
    { id: 'reservations', name: '예약', icon: Calendar, path: '/reservations' },
  ];

  useEffect(() => {
      const mainContent = document.querySelector('.main-content') as HTMLElement;
      if (mainContent) {
        mainContent.style.marginLeft = isCollapsed ? '70px' : '200px';
        mainContent.style.maxWidth = isCollapsed ? 'calc(100vw - 70px)' : 'calc(100vw - 200px)';
      }
  }, [isCollapsed]);

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-content">
        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <Link
                key={item.id}
                href={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                {isCollapsed ? <Icon size={20} /> : <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <button
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          {!isCollapsed && <span>메뉴 접기</span>}
        </button>
      </div>
    </aside>
  );
}

