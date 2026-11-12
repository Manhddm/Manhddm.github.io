import React from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';

export default function AboutPage() {
  return (
    <Layout
      title="Giới thiệu - Đồng Đức Mạnh"
      description="Giới thiệu về Đồng Đức Mạnh - Unity Game Developer.">
      <main className="container margin-vert--xl" style={{maxWidth: '800px'}}>
        <div className="custom-card" style={{padding: '2.5rem'}}>
          <div className="row" style={{alignItems: 'center'}}>
            <div className="col col--4" style={{textAlign: 'center', marginBottom: '1rem'}}>
              <img
                src="/img/avatar.png"
                alt="Đồng Đức Mạnh"
                style={{
                  width: '140px',
                  height: '140px',
                  borderRadius: '50%',
                  border: '3px solid var(--ifm-color-primary)',
                  objectFit: 'cover',
                }}
              />
            </div>
            <div className="col col--8">
              <Heading as="h1" style={{marginBottom: '0.25rem', fontSize: '2rem'}}>
                Đồng Đức Mạnh
              </Heading>
              <p
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: 'var(--ifm-color-primary)',
                  marginBottom: '1rem',
                }}>
                Unity Game Developer
              </p>
              <p style={{fontSize: '1.02rem', lineHeight: 1.75, marginBottom: '1rem'}}>
                Xin chào! Tôi là lập trình viên phát triển game với <strong>Unity</strong> và{' '}
                <strong>C#</strong>. Blog này là nơi tôi lưu trữ ghi chép và chia sẻ những kiến thức thực tế
                về lập trình game, cấu trúc code và giải quyết các vấn đề thường gặp trong quá trình làm việc.
              </p>

              <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginTop: '1.25rem'}}>
                <Link to="/blog" className="button button--primary">
                  📖 Đọc Blog
                </Link>
                <a
                  href="https://github.com/Manhddm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button--outline button--primary">
                  GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/m%E1%BA%A1nh-%C4%91%E1%BB%93ng-%C4%91%E1%BB%A9c-b2366b330"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button--outline button--secondary">
                  LinkedIn
                </a>
                <a
                  href="https://web.facebook.com/dongducmanhyb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button--outline button--secondary">
                  Facebook
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
