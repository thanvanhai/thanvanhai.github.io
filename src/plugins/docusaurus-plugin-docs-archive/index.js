// src/plugins/docusaurus-plugin-docs-archive/index.js

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const {normalizeUrl} = require('@docusaurus/utils');

function walk(dir, results = []) {
  const entries = fs.readdirSync(dir, {withFileTypes: true});
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, results);
    } else if (/\.(md|mdx)$/.test(entry.name) && !entry.name.startsWith('_')) {
      results.push(fullPath);
    }
  }
  return results;
}

// Mô phỏng cách Docusaurus bỏ tiền tố số thứ tự "01-ten-file" -> "ten-file"
function stripOrderPrefix(segment) {
  return segment.replace(/^\d+[-_]/, '');
}

// Ưu tiên 2: tính permalink theo đường dẫn file thật trên ổ đĩa
function permalinkFromFilePath(filePath, docsDir) {
  const relative = path.relative(docsDir, filePath);
  const withoutExt = relative.replace(/\.(md|mdx)$/, '');
  const segments = withoutExt.split(path.sep).map(stripOrderPrefix);
  if (segments[segments.length - 1].toLowerCase() === 'index') {
    segments.pop();
  }
  return '/docs/' + segments.join('/');
}

// Ưu tiên 1 > 2 > 3: slug frontmatter -> tên file -> id frontmatter
function resolvePermalink(data, filePath, docsDir) {
  if (data.slug) {
    const normalized = data.slug.startsWith('/') ? data.slug : `/${data.slug}`;
    return `/docs${normalized}`;
  }
  try {
    return permalinkFromFilePath(filePath, docsDir);
  } catch (e) {
    if (data.id) {
      return `/docs/${data.id}`;
    }
    throw e;
  }
}

// "so-sanh-group-by" -> "So Sanh Group By" (fallback khi không có _category_.json)
function prettifyFolderName(name) {
  return stripOrderPrefix(name)
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Đọc _category_.json (hoặc _category_.yml nếu bạn dùng yaml) của 1 thư mục
// Trả về {label, position} hoặc null nếu không có file.
function readCategoryMeta(dirPath) {
  const jsonPath = path.join(dirPath, '_category_.json');
  if (!fs.existsSync(jsonPath)) {
    return null;
  }
  try {
    // .replace(/^\uFEFF/, '') để bỏ BOM nếu file được lưu dạng UTF-8 with BOM
    // (khá phổ biến khi tạo/sửa file JSON bằng một số tool trên Windows),
    // vì BOM sẽ khiến JSON.parse ném lỗi "Unexpected token" dù nhìn file vẫn sạch.
    const rawText = fs.readFileSync(jsonPath, 'utf-8').replace(/^\uFEFF/, '');
    const raw = JSON.parse(rawText);
    return {
      label: raw.label || null,
      position: typeof raw.position === 'number' ? raw.position : null,
    };
  } catch (e) {
    // Không nuốt lỗi âm thầm nữa — in cảnh báo ra terminal để dễ debug lần sau.
    console.warn(`[docusaurus-plugin-docs-archive] Không đọc được ${jsonPath}: ${e.message}`);
    return null;
  }
}

// Category = thư mục cấp 1 ngay dưới docs/ (vd: docs/database/... -> "database")
// Nếu bài nằm ngay tại docs/ (không có thư mục con) -> không có category.
function resolveCategory(filePath, docsDir) {
  const relative = path.relative(docsDir, filePath);
  const segments = relative.split(path.sep);
  if (segments.length <= 1) {
    return null; // file nằm ngay gốc docs/, không thuộc category nào
  }
  const topFolder = segments[0];
  const topFolderPath = path.join(docsDir, topFolder);
  const meta = readCategoryMeta(topFolderPath);

  return {
    slug: stripOrderPrefix(topFolder),
    label: (meta && meta.label) || prettifyFolderName(topFolder),
    position: meta && meta.position !== null ? meta.position : 999,
  };
}

module.exports = function docsArchivePlugin(context) {
  const docsDir = path.join(context.siteDir, 'docs');

  return {
    name: 'docusaurus-plugin-docs-archive',

    getPathsToWatch() {
      return [path.join(docsDir, '**/*.{md,mdx}'), path.join(docsDir, '**/_category_.json')];
    },

    async loadContent() {
      if (!fs.existsSync(docsDir)) {
        return {posts: []};
      }

      const files = walk(docsDir);
      const posts = [];

      for (const file of files) {
        const raw = fs.readFileSync(file, 'utf-8');
        const {data} = matter(raw);

        if (data.draft || data.unlisted) continue;
        if (!data.date) continue;

        const permalink = resolvePermalink(data, file, docsDir);
        const category = resolveCategory(file, docsDir);

        posts.push({
          title: data.title || path.basename(file),
          date: String(data.date),
          permalink,
          tags: Array.isArray(data.tags) ? data.tags : [],
          category, // {slug, label, position} hoặc null
        });
      }

      posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {posts};
    },

    async contentLoaded({content, actions}) {
      const {createData, addRoute} = actions;
      const {baseUrl, i18n} = context;
      const {currentLocale, defaultLocale} = i18n;

      // Locale mặc định (vi) -> không tiền tố: /archives
      // Locale khác (en)     -> có tiền tố: /en/archives
      // Nếu không làm bước này, route sinh ra luôn là /archives bất kể locale nào,
      // trong khi <Link to="/archives"> ở navbar tự động thêm tiền tố locale hiện tại
      // -> lúc build "en" sẽ tìm /en/archives, không thấy trang -> broken link, build fail.
      const localePrefix = currentLocale === defaultLocale ? '' : `/${currentLocale}`;

      const postsJsonPath = await createData(
        'docs-archive-posts.json',
        JSON.stringify(content.posts),
      );

      addRoute({
        path: normalizeUrl([baseUrl, localePrefix, 'archives']),
        component: '@site/src/components/ArchivePage',
        modules: {
          posts: postsJsonPath,
        },
        exact: true,
      });
    },
  };
};