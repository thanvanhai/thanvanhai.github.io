// src/components/ArchivePage/index.js
import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import styles from './styles.module.css';

const MONTH_LABEL = (d) => `${d.getDate().toString().padStart(2, '0')} thg ${d.getMonth() + 1}`;

const UNCATEGORIZED = { slug: '__uncategorized__', label: 'Khác', position: 9999 };
const UNSUBCATEGORIZED = { slug: '__uncategorized__', label: null, position: 9999 };

// posts: [{title, date, permalink, tags, category, subCategory}]
// -> [{year, categories: [{slug, label, subCategories: [{slug, label, posts: [...]}]}]}]
function groupByYearThenCategory(posts) {
  const byYear = new Map();

  for (const post of posts) {
    const d = new Date(post.date);
    const year = d.getFullYear();
    const cat = post.category || UNCATEGORIZED;
    const subCat = post.subCategory || UNSUBCATEGORIZED;

    if (!byYear.has(year)) byYear.set(year, new Map());
    const byCategory = byYear.get(year);

    if (!byCategory.has(cat.slug)) {
      byCategory.set(cat.slug, {
        slug: cat.slug,
        label: cat.label,
        position: cat.position ?? 999,
        subCategories: new Map(),
      });
    }
    const categoryEntry = byCategory.get(cat.slug);

    if (!categoryEntry.subCategories.has(subCat.slug)) {
      categoryEntry.subCategories.set(subCat.slug, {
        slug: subCat.slug,
        label: subCat.label, // null nếu không có subcategory thật sự
        position: subCat.position ?? 999,
        posts: [],
      });
    }
    categoryEntry.subCategories.get(subCat.slug).posts.push({ ...post, _date: d });
  }

  const years = Array.from(byYear.keys()).sort((a, b) => b - a);

  return years.map((year) => {
    const categories = Array.from(byYear.get(year).values())
      .map((c) => ({
        ...c,
        subCategories: Array.from(c.subCategories.values())
          .map((sc) => ({
            ...sc,
            posts: sc.posts.sort((a, b) => b._date - a._date),
          }))
          .sort((a, b) => a.position - b.position || (a.label || '').localeCompare(b.label || '')),
      }))
      .sort((a, b) => a.position - b.position || a.label.localeCompare(b.label));

    return { year, categories };
  });
}

export default function ArchivePage({ posts }) {
  const grouped = groupByYearThenCategory(posts || []);

  return (
    <Layout title="Lưu trữ" description="Danh sách toàn bộ bài viết theo thời gian">
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Lưu trữ</h1>

        {grouped.map(({ year, categories }) => (
          <section key={year} className={styles.yearSection}>
            <h2 className={styles.yearTitle}>{year}</h2>

            {categories.map((category) => (
              <div key={category.slug} className={styles.categoryGroup}>
                <h3 className={styles.categoryTitle}>{category.label}</h3>

                {category.subCategories.map((subCategory) => (
                  <div key={subCategory.slug} className={styles.subCategoryGroup}>
                    {/* Chỉ hiện tiêu đề nhóm nhỏ nếu thực sự có subcategory (label khác null) */}
                    {subCategory.label && (
                      <h4 className={styles.subCategoryTitle}>{subCategory.label}</h4>
                    )}
                    <ul className={styles.timeline}>
                      {subCategory.posts.map((post) => (
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
              </div>
            ))}
          </section>
        ))}
        <p align="center" style={{ color: 'var(--ifm-color-primary)' }}>
          <strong>Chúc các bạn thành công và vui vẻ!</strong>
        </p>
      </div>
    </Layout>
  );
}