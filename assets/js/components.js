/**
 * components.js — Hệ thống component dùng chung cho toàn bộ trang
 *
 * Cách dùng: Trong mỗi trang HTML, khai báo SITE_ROOT trước khi load file này.
 *   - Trang gốc (index.html, about.html ...): window.SITE_ROOT = '';
 *   - Trang cấp 1 (tin-tuc/index.html ...): window.SITE_ROOT = '../';
 *   - Trang cấp 2 (lap-trinh/posts/bai.html ...): window.SITE_ROOT = '../../';
 *
 * Để thêm bài viết vào menu: thêm một entry vào NAV_ITEMS bên dưới.
 * Để thêm vào sidebar "Bài viết gần đây": thêm vào RECENT_POSTS.
 */
(function () {
  var ROOT = (typeof window.SITE_ROOT !== 'undefined') ? window.SITE_ROOT : '';

  /* =========================================================
   * CẤU HÌNH MENU (thêm / sửa menu tại đây)
   * ========================================================= */
  var NAV_ITEMS = [
    { label: 'TRANG CHỦ',    path: '/',            href: 'index.html' },
    { label: 'TIN TỨC',      path: '/tin-tuc',     href: 'tin-tuc/index.html' },
    {
      label: 'TÀI LIỆU',
      path: '/tai-lieu',
      submenu: [
        { label: 'Tổng quan',                path: '/tai-lieu',                                  href: 'tai-lieu/index.html' },
        { label: 'Cái bẫy "Current Cost"',   path: '/tai-lieu/posts/erp-current-cost-bay',       href: 'tai-lieu/posts/erp-current-cost-bay.html' }
      ]
    },
    {
      label: 'LẬP TRÌNH',
      path: '/lap-trinh',
      submenu: [
        { label: 'Tổng quan',        path: '/lap-trinh',                          href: 'lap-trinh/index.html' },
        { label: 'Web Serial API',   path: '/lap-trinh/posts/web-serial-api',     href: 'lap-trinh/posts/web-serial-api.html' },
        { label: 'USB Device Bridge',path: '/lap-trinh/posts/usb-device-bridge',  href: 'lap-trinh/posts/usb-device-bridge.html' }
      ]
    },
    { label: 'THIẾT KẾ WEB', path: '/thiet-ke-web', href: 'thiet-ke-web/index.html' },
    { label: 'PHẦN MỀM',     path: '/phan-mem',     href: 'phan-mem/index.html' },
    { label: 'GIẢI TRÍ',     path: '/giai-tri',     href: 'giai-tri/index.html' },
    { label: 'LIÊN HỆ',      path: '/lien-he',      href: 'lien-he.html' }
  ];

  /* =========================================================
   * CẤU HÌNH SIDEBAR (thêm bài viết gần đây tại đây)
   * ========================================================= */
  var RECENT_POSTS = [
    { label: 'Cái bẫy "Current Cost" trong ERP',  href: 'tai-lieu/posts/erp-current-cost-bay.html' },
    { label: 'Web Serial API cho trình duyệt',     href: 'lap-trinh/posts/web-serial-api.html' },
    { label: 'USB Device Bridge cơ bản',           href: 'lap-trinh/posts/usb-device-bridge.html' },
    { label: 'Bài viết mẫu tin tức',              href: 'tin-tuc/posts/bai-viet-mau.html' }
  ];

  var CATEGORIES = [
    { label: 'Tin tức',      href: 'tin-tuc/index.html' },
    { label: 'Tài liệu',     href: 'tai-lieu/index.html' },
    { label: 'Lập trình',    href: 'lap-trinh/index.html' },
    { label: 'Thiết kế web', href: 'thiet-ke-web/index.html' },
    { label: 'Phần mềm',     href: 'phan-mem/index.html' },
    { label: 'Giải trí',     href: 'giai-tri/index.html' }
  ];

  /* =========================================================
   * HÀM HỖ TRỢ
   * ========================================================= */
  function escAttr(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function a(href, label, dataPath) {
    var dp = dataPath !== undefined ? ' data-path="' + escAttr(dataPath) + '"' : '';
    return '<a' + dp + ' href="' + escAttr(ROOT + href) + '">' + label + '</a>';
  }

  /* =========================================================
   * RENDER BANNER
   * ========================================================= */
  function renderBanner() {
    return '<header class="site-header">' +
      '<div class="container">' +
      '<h1 class="site-title"><a href="' + escAttr(ROOT + 'index.html') + '">Blog của Hải Còi</a></h1>' +
      '<p class="site-subtitle">Chia Sẻ Kinh Nghiệm Lập Trình</p>' +
      '</div>' +
      '</header>';
  }

  /* =========================================================
   * RENDER NAV
   * ========================================================= */
  function renderNavItem(item) {
    if (item.submenu) {
      var subs = item.submenu.map(function (s) {
        return '<li>' + a(s.href, s.label, s.path) + '</li>';
      }).join('');
      return '<li class="has-submenu">' +
        '<button type="button">' + item.label + ' ▾</button>' +
        '<ul class="submenu">' + subs + '</ul>' +
        '</li>';
    }
    return '<li>' + a(item.href, item.label, item.path) + '</li>';
  }

  function renderNav() {
    var items = NAV_ITEMS.map(renderNavItem).join('');
    return '<nav class="navbar" aria-label="Điều hướng chính">' +
      '<div class="container nav-inner">' +
      '<button class="menu-toggle" aria-label="Mở menu">☰</button>' +
      '<ul class="menu">' + items + '</ul>' +
      '</div>' +
      '</nav>';
  }

  /* =========================================================
   * RENDER SIDEBAR
   * ========================================================= */
  function renderSidebar() {
    var recentItems = RECENT_POSTS.map(function (p) {
      return '<li>' + a(p.href, p.label) + '</li>';
    }).join('');
    var catItems = CATEGORIES.map(function (c) {
      return '<li>' + a(c.href, c.label) + '</li>';
    }).join('');
    return '<section class="widget">' +
        '<h3>Bài viết gần đây</h3>' +
        '<ul>' + recentItems + '</ul>' +
      '</section>' +
      '<section class="widget">' +
        '<h3>Danh mục</h3>' +
        '<ul>' + catItems + '</ul>' +
      '</section>';
  }

  /* =========================================================
   * RENDER FOOTER
   * ========================================================= */
  function renderFooter() {
    return '<footer class="site-footer">' +
      '<div class="container">' +
      '<p>© 2026 Blog của Hải Còi. All rights reserved.</p>' +
      '<div class="footer-links">' +
      '<a href="https://facebook.com" target="_blank" rel="noopener">Facebook</a>' +
      '<a href="https://github.com/thanvanhai" target="_blank" rel="noopener">GitHub</a>' +
      '<a href="mailto:thanvanhai@example.com">Email</a>' +
      '</div>' +
      '</div>' +
      '</footer>';
  }

  /* =========================================================
   * INJECT VÀO TRANG
   * ========================================================= */
  function replaceById(id, html) {
    var el = document.getElementById(id);
    if (!el) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    if (tmp.firstChild) el.parentNode.replaceChild(tmp.firstChild, el);
  }

  function fillById(id, html) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = html;
  }

  replaceById('site-banner', renderBanner());
  replaceById('site-nav', renderNav());
  fillById('site-sidebar', renderSidebar());
  replaceById('site-footer', renderFooter());

  /* =========================================================
   * KHỞI TẠO MENU (toggle, submenu, active link, smooth scroll)
   * ========================================================= */
  var menuToggle = document.querySelector('.menu-toggle');
  var menu = document.querySelector('.menu');
  if (menuToggle && menu) {
    menuToggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('.has-submenu > button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var parent = btn.closest('.has-submenu');
      if (parent) parent.classList.toggle('open');
    });
  });

  function normalizePath(p) {
    if (!p) return '/';
    return p
      .replace(/\/index\.html$/, '/')
      .replace(/\.html$/, '')
      .replace(/\/+$/, '') || '/';
  }

  var currentPath = normalizePath(window.location.pathname);
  document.querySelectorAll('.menu a[data-path]').forEach(function (link) {
    var lp = normalizePath(link.getAttribute('data-path'));
    if (lp && (currentPath === lp || currentPath.endsWith(lp) || currentPath.endsWith(lp + '/'))) {
      link.classList.add('active');
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var hash = anchor.getAttribute('href');
      var target = hash ? document.querySelector(hash) : null;
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
