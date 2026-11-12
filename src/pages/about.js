import React from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';

export default function AboutPage() {
  return (
    <Layout
      title="Giới thiệu - Đồng Đức Mạnh"
      description="Giới thiệu về Đồng Đức Mạnh - Unity Game Developer.">
      <main
        className="container margin-vert--xl"
        style={{maxWidth: '880px'}}>
        <Heading
          as="h1"
          style={{
            textAlign: 'center',
            fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
            fontWeight: 800,
            marginBottom: '2rem',
          }}>
          mình là ai?
        </Heading>

        <div
          className="althruist-card"
          style={{
            padding: '2.5rem',
          }}>
          <div className="row" style={{alignItems: 'center'}}>
            <div
              className="col col--4"
              style={{textAlign: 'center', marginBottom: '1.25rem'}}>
              <div
                style={{
                  width: '175px',
                  height: '175px',
                  margin: '0 auto',
                  padding: '10px',
                  borderRadius: '28px',
                  backgroundColor: 'var(--color-card)',
                  border: '2px solid var(--color-card-outline)',
                  boxShadow: '0 14px 32px var(--color-shadow)',
                }}>
                <img
                  src="/img/avatar.png"
                  alt="Đồng Đức Mạnh"
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '20px',
                    objectFit: 'cover',
                  }}
                />
              </div>
            </div>

            <div className="col col--8">
              <p
                style={{
                  fontSize: '1.22rem',
                  lineHeight: 1.8,
                  marginBottom: '1.25rem',
                }}>
                Xin chào! Mình là{' '}
                <strong style={{color: 'var(--color-secondary)', fontSize: '1.35rem'}}>
                  Đồng Đức Mạnh
                </strong>{' '}
                (thường gọi là{' '}
                <strong style={{color: 'var(--color-primary)'}}>Manhddm</strong>), một{' '}
                <strong style={{color: 'var(--color-primary)'}}>
                  Unity Game Developer
                </strong>
                .
              </p>

              <p
                style={{
                  fontSize: '1.08rem',
                  lineHeight: 1.8,
                  marginBottom: '1.75rem',
                  opacity: 0.92,
                }}>
                Blog này là góc nhỏ nơi mình lưu trữ các ghi chép kỹ thuật, chia sẻ kinh
                nghiệm thực tế về lập trình <strong>Unity</strong>, ngôn ngữ{' '}
                <strong>C#</strong>, cấu trúc code sạch (Clean Architecture) và những bài
                học rút ra trong quá trình làm game.
              </p>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.85rem',
                }}>
                <Link to="/blog" className="althruist-btn">
                  đọc blog →
                </Link>
                <a
                  href="https://github.com/Manhddm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="althruist-btn althruist-btn--outline">
                  GitHub
                </a>
                <a
                  href="https://www.linkedin.com/in/m%E1%BA%A1nh-%C4%91%E1%BB%93ng-%C4%91%E1%BB%A9c-b2366b330"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="althruist-btn althruist-btn--outline">
                  LinkedIn
                </a>
                <a
                  href="https://web.facebook.com/dongducmanhyb"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="althruist-btn althruist-btn--outline">
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
