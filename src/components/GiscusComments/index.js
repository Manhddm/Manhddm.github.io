import React from 'react';
import Giscus from '@giscus/react';
import {useColorMode} from '@docusaurus/theme-common';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function GiscusComments() {
  const {colorMode} = useColorMode();
  const {siteConfig} = useDocusaurusContext();
  const giscusConfig = siteConfig.themeConfig?.giscus;

  // Nếu chưa cấu hình repoId & categoryId thì hiện hướng dẫn gọn cho chủ blog
  if (!giscusConfig?.repoId || !giscusConfig?.categoryId) {
    return (
      <div
        className="custom-card margin-top--xl"
        style={{
          textAlign: 'center',
          padding: '1.5rem',
          borderStyle: 'dashed',
        }}>
        <p style={{marginBottom: '0.5rem', fontWeight: 600}}>
          💬 Khu vực bình luận (Giscus — GitHub Discussions)
        </p>
        <p style={{marginBottom: 0, fontSize: '0.9rem', color: 'var(--ifm-color-emphasis-700)'}}>
          Để kích hoạt bình luận, hãy bật <strong>Discussions</strong> trên repo{' '}
          <code>Manhddm/manhddm.github.io</code>, lấy <code>repoId</code> &amp; <code>categoryId</code> tại{' '}
          <a href="https://giscus.app/vi" target="_blank" rel="noopener noreferrer">
            giscus.app/vi
          </a>{' '}
          và điền vào <code>themeConfig.giscus</code> trong <code>docusaurus.config.js</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="margin-top--xl">
      <Giscus
        id="comments"
        repo={giscusConfig.repo || 'Manhddm/manhddm.github.io'}
        repoId={giscusConfig.repoId}
        category={giscusConfig.category || 'General'}
        categoryId={giscusConfig.categoryId}
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="top"
        theme={colorMode === 'dark' ? 'dark_dimmed' : 'light'}
        lang="vi"
        loading="lazy"
      />
    </div>
  );
}
