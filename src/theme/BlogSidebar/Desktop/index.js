import React, {useState, useEffect} from 'react';
import Desktop from '@theme-original/BlogSidebar/Desktop';

export default function DesktopWrapper(props) {
  const [hidden, setHidden] = useState(false);

  // Gắn/gỡ class trên <body> để custom.css style toàn trang theo trạng thái này
  useEffect(() => {
    if (hidden) {
      document.body.classList.add('sidebar-hidden');
    } else {
      document.body.classList.remove('sidebar-hidden');
    }
    // Dọn dẹp khi rời trang, tránh còn sót class ảnh hưởng trang khác
    return () => document.body.classList.remove('sidebar-hidden');
  }, [hidden]);

  return (
    <div className="customSidebarWrapper">
      <button
        className="customSidebarToggle"
        onClick={() => setHidden(!hidden)}
        title={hidden ? 'Hiện Recent posts' : 'Ẩn Recent posts'}
      >
        {hidden ? '☰' : '✕'}
      </button>
      <div className={hidden ? 'customSidebarHidden' : ''}>
        <Desktop {...props} />
      </div>
    </div>
  );
}