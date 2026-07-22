import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Blog của Hải Còi',
  tagline: 'Chia Sẻ Kinh Nghiệm Lập Trình & ERP',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },
  // 👇 thêm dòng này — báo cho markdown parser hiểu cú pháp ```mermaid
  markdown: {
    mermaid: true,
  },
  // Set the production url of your site here
  url: 'https://thanvanhai.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // Vì đây là repo dạng <username>.github.io nên baseUrl là '/'
  baseUrl: '/',

  // GitHub pages deployment config.
  organizationName: 'thanvanhai', // GitHub username của bạn
  projectName: 'thanvanhai.github.io', // Tên repo

  onBrokenLinks: 'throw',

  // Tương đương "timezone: Asia/Ho_Chi_Minh" bên Jekyll — Docusaurus không có
  // field timezone riêng, ngày giờ bài viết sẽ lấy theo front matter từng post.

  // Đa ngôn ngữ: mặc định tiếng Việt, có thêm tiếng Anh
  i18n: {
    defaultLocale: 'vi',
    locales: ['vi', 'en'],
    localeConfigs: {
      vi: {
        label: 'Tiếng Việt',
        htmlLang: 'vi',
      },
      en: {
        label: 'English',
        htmlLang: 'en',
      },
    },
  },

  // KaTeX CSS - bắt buộc để công thức toán render đúng định dạng
  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
      type: 'text/css',
      integrity:
        'sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV',
      crossorigin: 'anonymous',
    },
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Nút "Edit this page" sẽ trỏ về repo của bạn
          editUrl:
            'https://github.com/thanvanhai/thanvanhai.github.io/tree/main/',
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        },
        blog: {
          showReadingTime: true,
          // Tương đương "paginate: 10" bên Jekyll
          postsPerPage: 10,
          // 👈 thêm dòng này — hiện toàn bộ bài viết ở sidebar "Recent posts"  
          //blogSidebarCount: 'ALL', 
          // hoặc: hiện tối đa 10 bài
          blogSidebarCount: 10,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl:
            'https://github.com/thanvanhai/thanvanhai.github.io/tree/main/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        },
        theme: {
          customCss: './src/css/custom.css',
        },
        // Tương đương "google.id" bên Jekyll analytics — điền GA4 measurement ID nếu có
        //googleAnalytics: undefined,
        gtag: { trackingID: 'G-49J8NPZR3L' },
      } satisfies Preset.Options,
    ],
  ],

  plugins: ['./src/plugins/docusaurus-plugin-docs-archive'],
  // 👇 thêm dòng này — đăng ký theme render mermaid
  themes: ['@docusaurus/theme-mermaid'],

  themeConfig: {
    image: 'img/og-banner-1280x640.png',
    colorMode: {
      // Tương đương "theme_mode: để trống → theo hệ điều hành" bên Jekyll
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        hideable: true,           // 👈 hiện nút mũi tên để thu gọn/mở rộng sidebar
        autoCollapseCategories: true, // 👈 tự đóng category khác khi mở 1 category (tùy chọn)
      },
    },
    navbar: {
      title: 'Blog của Hải Còi',
      logo: {
        alt: 'Hải Còi Logo',
        src: 'img/logo-light.png',
        srcDark: 'img/logo-dark.png',
        width: 40,
        height: 40,
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Tài liệu',
        },
        { to: '/archives', label: 'Lưu trữ', position: 'left' },
        { to: '/blog', label: 'Blog', position: 'left' },
        { to: '/about', label: 'Giới thiệu', position: 'left' },
        {
          // Nút chuyển ngôn ngữ (tương đương language switcher đã bàn ở jekyll-polyglot)
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/thanvanhai',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Tài liệu',
          items: [
            {
              label: 'Tất cả tài liệu',
              to: '/docs',
            },
          ],
        },
        {
          title: 'Blog',
          items: [
            {
              label: 'Tất cả bài viết',
              to: '/blog',
            },
          ],
        },
        {
          title: 'Kết nối',
          items: [
            {
              // Tương đương "social.links" bên Jekyll
              label: 'GitHub',
              href: 'https://github.com/thanvanhai',
            },
            {
              label: 'Email',
              href: 'mailto:thanvanhai@example.com',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Hải Còi. Built with Docusaurus.`,
    },
    prism: {
      // Tương đương "syntax_highlighter: rouge" bên Jekyll kramdown
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;