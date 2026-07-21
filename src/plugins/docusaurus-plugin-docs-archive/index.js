// src/plugins/docusaurus-plugin-docs-archive/index.js

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

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
  // 1. slug tường minh - luôn được Docusaurus prepend /docs, dù tuyệt đối hay tương đối
  if (data.slug) {
    const normalized = data.slug.startsWith('/') ? data.slug : `/${data.slug}`;
    return `/docs${normalized}`;
  }

  // 2. Suy ra theo tên/đường dẫn file thật (đúng cách Docusaurus mặc định làm)
  try {
    return permalinkFromFilePath(filePath, docsDir);
  } catch (e) {
    // 3. Fallback cuối cùng nếu vì lý do gì đó không tính được từ path (hiếm khi xảy ra)
    if (data.id) {
      return `/docs/${data.id}`;
    }
    throw e;
  }
}

module.exports = function docsArchivePlugin(context) {
  const docsDir = path.join(context.siteDir, 'docs');

  return {
    name: 'docusaurus-plugin-docs-archive',

    // Quan trọng: báo cho Docusaurus biết cần theo dõi thư mục docs
    // để mỗi khi thêm/sửa file .md, dev server tự re-run loadContent()
    getPathsToWatch() {
      return [path.join(docsDir, '**/*.{md,mdx}')];
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

        posts.push({
          title: data.title || path.basename(file),
          date: String(data.date),
          permalink,
          tags: Array.isArray(data.tags) ? data.tags : [],
        });
      }

      posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {posts};
    },

    async contentLoaded({content, actions}) {
      const {createData, addRoute} = actions;

      const postsJsonPath = await createData(
        'docs-archive-posts.json',
        JSON.stringify(content.posts),
      );

      addRoute({
        path: '/archives',
        component: '@site/src/components/ArchivePage',
        modules: {posts: postsJsonPath},
        exact: true,
      });
    },
  };
};