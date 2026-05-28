(function () {
  const menuToggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.menu');

  if (menuToggle && menu) {
    menuToggle.addEventListener('click', function () {
      menu.classList.toggle('is-open');
    });
  }

  document.querySelectorAll('.has-submenu > button').forEach(function (button) {
    button.addEventListener('click', function () {
      const parent = button.closest('.has-submenu');
      if (parent) parent.classList.toggle('open');
    });
  });

  function normalizePath(path) {
    if (!path) return '/';
    const withoutDomainPrefix = path
      .replace(/\/index\.html$/, '/')
      .replace(/\.html$/, '')
      .replace(/\/+$/, '');
    return withoutDomainPrefix || '/';
  }

  const currentPath = normalizePath(window.location.pathname);
  document.querySelectorAll('.menu a[data-path]').forEach(function (link) {
    const linkPath = normalizePath(link.getAttribute('data-path'));
    if (
      linkPath &&
      (currentPath === linkPath ||
        currentPath.endsWith(linkPath) ||
        currentPath.endsWith(linkPath + '/'))
    ) {
      link.classList.add('active');
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
      const hash = anchor.getAttribute('href');
      const target = hash ? document.querySelector(hash) : null;
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();
