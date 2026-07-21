import React, { useState,  JSX } from 'react';
import Link from '@docusaurus/Link';
import { useDocsSidebar } from '@docusaurus/plugin-content-docs/client';
import styles from './styles.module.css';

function countPosts(item: any): number {
  if (item.type === 'link') return 1;
  if (item.type === 'category') {
    return item.items.reduce((acc: number, sub: any) => acc + countPosts(sub), 0);
  }
  return 0;
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" className={styles.icon} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function DocCategoryTree(): JSX.Element | null {
  const sidebar = useDocsSidebar();
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  if (!sidebar) return null;

  const parentCategories = sidebar.items.filter((item: any) => item.type === 'category');

  const toggle = (key: string) => {
    setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className={styles.tree}>
      {parentCategories.map((parentCat: any, idx: number) => {
        const key = parentCat.label + idx;
        const subCategories = parentCat.items.filter((item: any) => item.type === 'category');
        const totalPosts = countPosts(parentCat);
        const isOpen = openMap[key];

        return (
          <div key={key} className={styles.group}>
            <div className={styles.parentRow} onClick={() => toggle(key)}>
              <span className={styles.rowLeft}>
                <FolderIcon />
                <Link to={parentCat.href} className={styles.parentLabel} onClick={(e) => e.stopPropagation()}>
                  {parentCat.label}
                </Link>
                <span className={styles.meta}>
                  {subCategories.length} chuyên mục, {totalPosts} bài viết
                </span>
              </span>
              <ChevronIcon open={isOpen} />
            </div>

            {isOpen &&
              subCategories.map((subCat: any, subIdx: number) => (
                <div key={subIdx} className={styles.childRow}>
                  <span className={styles.rowLeft}>
                    <FolderIcon />
                    <Link to={subCat.href} className={styles.childLabel}>
                      {subCat.label}
                    </Link>
                  </span>
                  <span className={styles.meta}>{countPosts(subCat)} bài viết</span>
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}