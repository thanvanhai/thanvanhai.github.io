import React from 'react';
import Layout from '@theme/Layout';
import styles from './styles.module.css';

interface ArchivePost {
  title: string;
  date: string;
  permalink: string;
  tags: string[];
}

interface ArchivePageProps {
  posts: ArchivePost[];
}

function groupByYear(posts: ArchivePost[]): [string, ArchivePost[]][] {
  const groups: Record<string, ArchivePost[]> = {};
  posts.forEach((post) => {
    const year = new Date(post.date).getFullYear().toString();
    if (!groups[year]) groups[year] = [];
    groups[year].push(post);
  });
  return Object.entries(groups).sort((a, b) => Number(b[0]) - Number(a[0]));
}

function formatDayMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', {day: '2-digit', month: 'short'});
}

export default function ArchivePage({posts}: ArchivePageProps): JSX.Element {
  const grouped = groupByYear(posts);

  return (
    <Layout
      title="Archives"
      description="Danh sách tất cả bài viết theo thời gian">
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Archives</h1>

        {grouped.length === 0 && (
          <p className={styles.empty}>
            Chưa có bài viết nào có frontmatter <code>date</code>. Thêm{' '}
            <code>date: YYYY-MM-DD</code> vào đầu file docs để bài xuất hiện ở đây.
          </p>
        )}

        {grouped.map(([year, yearPosts]) => (
          <div key={year} className={styles.yearBlock}>
            <h2 className={styles.year}>{year}</h2>
            <ul className={styles.timeline}>
              {yearPosts.map((post) => (
                <li key={post.permalink} className={styles.item}>
                  <span className={styles.date}>{formatDayMonth(post.date)}</span>
                  <span className={styles.dot} />
                  <a href={post.permalink} className={styles.link}>
                    {post.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Layout>
  );
}