import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

export default function Home() {
  return (
    <Layout
      title="Đồng Đức Mạnh - Unity Developer"
      description="Trang giới thiệu của Đồng Đức Mạnh, Unity Developer.">
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <div className="container">
          <p className={styles.eyebrow}>Xin chào, tôi là</p>
          <Heading as="h1" className="hero__title">Đồng Đức Mạnh</Heading>
          <p className="hero__subtitle">Unity Developer</p>
          <p className={styles.intro}>
            Tôi phát triển game bằng Unity và C#, đồng thời chia sẻ những kiến
            thức thực tế về cấu trúc game, thuật toán và lập trình.
          </p>
          <div className={styles.buttons}>
            <Link className="button button--secondary button--lg" to="/blog">
              Đọc blog
            </Link>
            <a
              className="button button--outline button--lg"
              href="https://github.com/Manhddm">
              GitHub
            </a>
          </div>
        </div>
      </header>
    </Layout>
  );
}
