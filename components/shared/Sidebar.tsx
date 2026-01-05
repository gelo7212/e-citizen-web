'use client';

import React from 'react';
import Link from 'next/link';

interface SidebarLink {
  label: string;
  href: string;
  icon?: string;
  badge?: number;
  requiredScope?: string;
  children?: SidebarLink[];
}

interface AdminSidebarProps {
  links: SidebarLink[];
  canAccess?: (scope?: string) => boolean;
}

export function AdminSidebar({ links, canAccess }: AdminSidebarProps) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

  const toggleExpand = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderLink = (link: SidebarLink, level = 0) => {
    if (link.requiredScope && canAccess && !canAccess(link.requiredScope)) {
      return null;
    }

    const hasChildren = link.children && link.children.length > 0;

    return (
      <div key={link.href}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpand(link.label)}
            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center justify-between"
          >
            <span>{link.icon} {link.label}</span>
            <span className="text-gray-400">
              {expanded[link.label] ? '−' : '+'}
            </span>
          </button>
        ) : (
          <Link
            href={link.href}
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center justify-between"
          >
            <span>{link.icon} {link.label}</span>
            {link.badge && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {link.badge}
              </span>
            )}
          </Link>
        )}

        {hasChildren && expanded[link.label] && (
          <div className="bg-gray-50 border-l-2 border-gray-200">
            {link.children?.map((child) => renderLink(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">e-Citizen Admin</h1>
      </div>
      <div className="py-4">{links.map((link) => renderLink(link))}</div>
    </nav>
  );
}
