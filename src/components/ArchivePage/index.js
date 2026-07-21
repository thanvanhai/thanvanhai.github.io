// src/components/ArchivePage/index.js
import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const MONTH_LABEL = (d) => `${d.getDate().toString().padStart(2, '0')} thg ${d.getMonth() + 1}`;

const UNCATEGORIZED = {slug: '__uncategorized__', label: 'Khác', position: 9999};

// posts: [{title, date, permalink, tags, category: {slug,label,position}|null}]
// -> [{year, categories: [{slug, label, posts: [...]}]}]  (năm giảm dần, category theo position rồi alphabet, bài theo ngày giảm dần)
function groupByYearThenCategory(posts) {
  const byYear = new Map();

  for (const post of posts) {
    const d = new Date(post.date);
    const year = d.getFullYear();
    const cat = post.category || UNCATEGORIZED;

    if (!byYear.has(year)) byYear.set(year, new Map());
    const byCategory = byYear.get(year);

    if (!byCategory.has(cat.slug)) {
      byCategory.set(cat.slug, {slug: cat.slug, label: cat.label, position: cat.position ?? 999, posts: []});
    }
    byCategory.get(cat.slug).posts.push({...post, _date: d});
  }

  const years = Array.from(byYear.keys()).sort((a, b) => b - a);

  return years.map((year) => {
    const categories = Array.from(byYear.get(year).values())
      .map((c) => ({
        ...c,
        posts: c.posts.sort((a, b) => b._date - a._date),
      }))
      .sort((a, b) => a.position - b.position || a.label.localeCompare(b.label));

    return {year, categories};
  });
}

export default function ArchivePage({posts}) {
  const grouped = groupByYearThenCategory(posts || []);

  return (
    <Layout title="Archives" description="Danh sách toàn bộ bài viết theo thời gian">
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Archives</h1>

        {grouped.map(({year, categories}) => (
          <section key={year} className={styles.yearSection}>
            <h2 className={styles.yearTitle}>{year}</h2>

            {categories.map((category) => (
              <div key={category.slug} className={styles.categoryGroup}>
                <h3 className={styles.categoryTitle}>{category.label}</h3>
                <ul className={styles.timeline}>
                  {category.posts.map((post) => (
                    <li key={post.permalink} className={styles.timelineItem}>
                      <span className={styles.timelineDot} />
                      <span className={styles.timelineDate}>{MONTH_LABEL(post._date)}</span>
                      <Link to={post.permalink} className={styles.timelineLink}>
                        {post.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))}
      </div>
    </Layout>
  );
}