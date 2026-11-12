import React from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';

export default function ProjectsPage() {
  return (
    <Layout
      title="Dự án Game - Đồng Đức Mạnh"
      description="Danh sách các dự án game Unity của Đồng Đức Mạnh.">
      <main
        className="container margin-vert--xl"
        style={{maxWidth: '820px'}}>
        <Heading
          as="h1"
          style={{
            textAlign: 'center',
            fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
            fontWeight: 800,
            marginBottom: '2rem',
          }}>
          dự án nổi bật
        </Heading>

        <div
          className="althruist-card"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
          }}>
          <p
            style={{
              fontSize: '1.3rem',
              marginBottom: '0.75rem',
              fontWeight: 800,
              color: 'var(--color-title-text)',
            }}>
            🚧 các dự án đang được tổng hợp và cập nhật...
          </p>
          <p
            style={{
              color: 'var(--color-alt-text)',
              fontSize: '1.08rem',
              maxWidth: '580px',
              margin: '0 auto 2rem',
              lineHeight: 1.75,
            }}>
            Hiện tại mình đang hoàn thiện tài liệu và hình ảnh cho các dự án cá nhân.
            Trong lúc chờ đợi, bạn có thể đọc các bài viết kỹ thuật trên Blog hoặc ghé
            thăm GitHub của mình nhé!
          </p>
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
            <Link to="/blog" className="althruist-btn">
              đọc blog →
            </Link>
            <a
              href="https://github.com/Manhddm"
              target="_blank"
              rel="noopener noreferrer"
              className="althruist-btn althruist-btn--outline">
              GitHub (@Manhddm) ↗
            </a>
          </div>
        </div>
      </main>
    </Layout>
  );
}
