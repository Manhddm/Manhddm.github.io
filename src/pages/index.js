import React, {useMemo} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

// Tự động lấy danh sách các bài viết trong thư mục /blog để hiển thị trên trang chủ
function useRecentBlogPosts(limit = 6) {
  return useMemo(() => {
    try {
      // @ts-ignore - Webpack require.context được hỗ trợ sẵn trong Docusaurus
      const context = require.context('../../blog', true, /\.mdx?$/);
      const posts = context
        .keys()
        .map((key) => {
          const mod = context(key);
          const metadata = mod.metadata || {};
          const frontMatter = mod.frontMatter || {};

          const folderDateMatch = key.match(/(\d{4}-\d{2}-\d{2})/);
          const rawDate =
            metadata.date ||
            frontMatter.date ||
            (folderDateMatch ? folderDateMatch[1] : '2026-01-01');

          const slug =
            frontMatter.slug ||
            key
              .replace(/^\.\//, '')
              .replace(/\/index\.mdx?$/, '')
              .replace(/\.mdx?$/, '')
              .replace(/^\d{4}-\d{2}-\d{2}-/, '');

          const permalink = metadata.permalink || `/blog/${slug}`;
          const title = metadata.title || frontMatter.title || mod.contentTitle || slug;
          const description =
            metadata.description ||
            frontMatter.description ||
            'Chia sẻ kiến thức thực chiến về phát triển game với Unity, C# và kiến trúc phần mềm.';
          const tags = frontMatter.tags || [];

          return {
            title,
            permalink,
            date: rawDate,
            formattedDate: new Date(rawDate).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }),
            description,
            tags,
          };
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return posts.slice(0, limit);
    } catch {
      return [];
    }
  }, [limit]);
}

function HeroSection() {
  return (
    <header className={styles.heroHeader}>
      <div className={styles.heroBackdrop} />
      <div className={styles.headerContent}>
        <div className={styles.heroTextCol}>
          <Heading as="h1" className={styles.greetingTitle}>
            xin chào, mình là <span className={styles.highlightName}>Đồng Đức Mạnh</span>!
          </Heading>
          <p className={styles.headline}>UNITY GAME DEVELOPER </p>
          <p className={styles.intro}>
            Mình phát triển game bằng <strong>Unity</strong> và <strong>C#</strong>, đồng thời
            ghi chép lại những kiến thức thực tế về kiến trúc game (Clean Architecture, DI),
            thuật toán và tối ưu hiệu năng.
          </p>
          <div className={styles.buttons}>
            <Link className="althruist-btn" to="/blog">
              đọc blog →
            </Link>
            <Link className={clsx('althruist-btn', 'althruist-btn--outline')} to="/projects">
              dự án game
            </Link>
            <Link className={clsx('althruist-btn', 'althruist-btn--outline')} to="/about">
              về mình
            </Link>
          </div>
        </div>

        <div className={styles.heroAvatarWrap}>
          <div className={styles.heroAvatarCard}>
            <div className={styles.heroAvatarInner}>
              <img
                src="/img/avatar.png"
                alt="Đồng Đức Mạnh (Pixel Avatar)"
                className={clsx(styles.heroAvatar, styles.heroAvatarPixel)}
              />
              <img
                src="/img/avatar-real.jpg"
                alt="Đồng Đức Mạnh"
                className={clsx(styles.heroAvatar, styles.heroAvatarReal)}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function RecentPostsSection({posts}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <Heading as="h2" className={styles.sectionTitle}>
          bài viết mới nhất
        </Heading>
        <p className={styles.sectionSubtitle}>
          Ghi chép kỹ thuật, Design Patterns và kinh nghiệm làm việc với Unity
        </p>
      </div>

      <div className={styles.flexCards}>
        {posts.map((post, index) => (
          <article key={post.permalink} className={styles.postCard}>
            <div>
              <div className={styles.postTopRow}>
                <span className={styles.postDate}>{post.formattedDate}</span>
                {index === 0 && <span className={styles.featuredBadge}>Mới nhất</span>}
              </div>

              <Heading as="h3" className={styles.cardTitle}>
                <Link to={post.permalink}>{post.title}</Link>
              </Heading>

              <p className={styles.cardDesc}>{post.description}</p>
            </div>

            <div>
              <div className={styles.tagList}>
                {post.tags.map((tag) => {
                  const tagLabel = typeof tag === 'string' ? tag : tag.label;
                  return (
                    <span key={tagLabel} className="skill-badge">
                      #{tagLabel}
                    </span>
                  );
                })}
              </div>

              <div className={styles.cardFooter}>
                <Link to={post.permalink} className={styles.readMoreBtn}>
                  đọc chi tiết
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.viewAllWrap}>
        <Link to="/blog" className="althruist-btn althruist-btn--outline">
          xem tất cả bài viết →
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  const recentPosts = useRecentBlogPosts(6);

  return (
    <Layout
      title="Đồng Đức Mạnh - Unity Developer"
      description="Blog chia sẻ kiến thức Unity, C#, Game Architecture và Portfolio của Đồng Đức Mạnh.">
      <HeroSection />
      <main>
        <RecentPostsSection posts={recentPosts} />
      </main>
    </Layout>
  );
}
