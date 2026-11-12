import React from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';

export default function ProjectsPage() {
  return (
    <Layout
      title="Dự án Game - Đồng Đức Mạnh"
      description="Danh sách các dự án game Unity của Đồng Đức Mạnh.">
      <main className="container margin-vert--xl" style={{maxWidth: '800px'}}>
        <Heading as="h1" className="margin-bottom--md">
          🎮 Dự án Game
        </Heading>

        <div
          className="custom-card"
          style={{
            padding: '2.5rem',
            textAlign: 'center',
          }}>
          <p style={{fontSize: '1.15rem', marginBottom: '0.75rem', fontWeight: 600}}>
            🚧 Các dự án đang được tổng hợp và cập nhật...
          </p>
          <p
            style={{
              color: 'var(--ifm-color-emphasis-700)',
              marginBottom: '1.5rem',
              lineHeight: 1.7,
            }}>
            Hiện tại tôi đang hoàn thiện tài liệu và hình ảnh cho các dự án cá nhân. Trong lúc chờ đợi, bạn
            có thể xem các bài viết kỹ thuật trên Blog hoặc ghé thăm GitHub của tôi nhé!
          </p>
          <div style={{display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap'}}>
            <Link to="/blog" className="button button--primary">
              📖 Đọc Blog
            </Link>
            <a
              href="https://github.com/Manhddm"
              target="_blank"
              rel="noopener noreferrer"
              className="button button--outline button--primary">
              GitHub (@Manhddm) ↗
            </a>
          </div>
        </div>
      </main>
    </Layout>
  );
}
