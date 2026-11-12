import React, {useMemo} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import {PROJECTS, SKILL_GROUPS} from '@site/src/data/projects';
import styles from './index.module.css';

// Tự động lấy danh sách các bài viết trong thư mục /blog để hiển thị trên trang chủ
function useRecentBlogPosts(limit = 3) {
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

          // Trích xuất ngày từ metadata hoặc từ tên thư mục (VD: 2026-11-12-...)
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
            'Bài viết chia sẻ kiến thức thực tế về phát triển game với Unity và C#.';
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
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className={clsx('container', styles.heroContainer)}>
        <img
          src="/img/avatar.png"
          alt="Đồng Đức Mạnh Avatar"
          className={styles.heroAvatar}
        />
        <p className={styles.eyebrow}>Xin chào, tôi là</p>
        <Heading as="h1" className={clsx('hero__title', styles.heroTitle)}>
          Đồng Đức Mạnh
        </Heading>
        <p className={clsx('hero__subtitle', styles.heroSubtitle)}>
          Unity Game Developer
        </p>
        <p className={styles.intro}>
          Tôi phát triển game bằng <strong>Unity</strong> và <strong>C#</strong>, tập trung vào
          kiến trúc phần mềm sạch (Clean Architecture), tối ưu hóa hiệu năng và chia sẻ
          những bài học thực chiến trong quá trình làm game.
        </p>
        <div className={styles.buttons}>
          <Link className="button button--secondary button--lg" to="/blog">
            📖 Đọc Blog
          </Link>
          <Link className={clsx('button button--outline button--lg', styles.outlineBtn)} to="/projects">
            🎮 Dự án Game
          </Link>
          <Link className={clsx('button button--outline button--lg', styles.outlineBtn)} to="/about">
            👤 Về tôi
          </Link>
        </div>
      </div>
    </header>
  );
}

function RecentPostsSection({posts}) {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <div>
            <Heading as="h2" className={styles.sectionTitle}>
              📝 Bài viết mới nhất
            </Heading>
            <p className={styles.sectionSubtitle}>
              Ghi chép kỹ thuật, Design Patterns và kinh nghiệm làm việc với Unity
            </p>
          </div>
          <Link to="/blog" className="button button--outline button--primary">
            Xem tất cả bài viết →
          </Link>
        </div>

        <div className="row">
          {posts.map((post) => (
            <div key={post.permalink} className="col col--4 margin-bottom--lg">
              <article className="custom-card">
                <div>
                  <div className={styles.postMeta}>
                    <span>📅 {post.formattedDate}</span>
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
                  <Link to={post.permalink} className={styles.readMoreLink}>
                    Đọc chi tiết →
                  </Link>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SkillsSection() {
  return (
    <section className={clsx(styles.section, styles.sectionAlt)}>
      <div className="container">
        <div className={styles.sectionHeaderCentered}>
          <Heading as="h2" className={styles.sectionTitle}>
            ⚡ Kỹ năng &amp; Công nghệ
          </Heading>
          <p className={styles.sectionSubtitle}>
            Bộ công cụ và tư duy kỹ thuật tôi áp dụng hằng ngày để xây dựng các dự án Unity bền vững
          </p>
        </div>

        <div className="row">
          {SKILL_GROUPS.map((group) => (
            <div key={group.title} className="col col--4 margin-bottom--lg">
              <div className="custom-card">
                <div>
                  <Heading as="h3" className={styles.cardTitle}>
                    {group.title}
                  </Heading>
                  <p className={styles.cardDesc}>{group.description}</p>
                </div>
                <div className={styles.skillBadgeContainer}>
                  {group.skills.map((skill) => (
                    <span key={skill} className="skill-badge">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedProjectsSection() {
  const featured = PROJECTS.filter((p) => p.featured);
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.sectionHeader}>
          <div>
            <Heading as="h2" className={styles.sectionTitle}>
              🚀 Dự án Game nổi bật
            </Heading>
            <p className={styles.sectionSubtitle}>
              Các sản phẩm game, prototype và bộ công cụ mã nguồn mở tiêu biểu
            </p>
          </div>
          <Link to="/projects" className="button button--outline button--primary">
            Xem toàn bộ Portfolio →
          </Link>
        </div>

        <div className="row">
          {featured.map((project) => (
            <div key={project.id} className="col col--4 margin-bottom--lg">
              <div className="custom-card">
                <div>
                  <div
                    className={styles.projectBanner}
                    style={{background: project.coverGradient}}>
                    <span className={styles.projectIcon}>{project.icon}</span>
                    <span className={styles.projectGenre}>{project.genre}</span>
                  </div>
                  <Heading as="h3" className={styles.cardTitle}>
                    {project.title}
                  </Heading>
                  <p className={styles.cardDesc}>{project.description}</p>
                </div>

                <div>
                  <div className={styles.tagList}>
                    {project.techStack.slice(0, 4).map((tech) => (
                      <span key={tech} className="skill-badge">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className={styles.projectLinks}>
                    <Link to="/projects" className="button button--primary button--sm">
                      Chi tiết
                    </Link>
                    {project.links.github && (
                      <a
                        href={project.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button button--secondary button--sm">
                        GitHub ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const recentPosts = useRecentBlogPosts(3);

  return (
    <Layout
      title="Đồng Đức Mạnh - Unity Developer"
      description="Blog chia sẻ kiến thức Unity, C#, Game Architecture và Portfolio của Đồng Đức Mạnh.">
      <HeroSection />
      <main>
        <RecentPostsSection posts={recentPosts} />
        {/* Tạm ẩn phần Kỹ năng & Công nghệ và Dự án nổi bật, bỏ comment khi cần hiển thị lại */}
        {/* <SkillsSection /> */}
        {/* <FeaturedProjectsSection /> */}
      </main>
    </Layout>
  );
}
