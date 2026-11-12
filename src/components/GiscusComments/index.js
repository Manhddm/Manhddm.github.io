import React from 'react';
import Giscus from '@giscus/react';
import {useColorMode} from '@docusaurus/theme-common';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

export default function GiscusComments() {
  const {colorMode} = useColorMode();
  const {siteConfig} = useDocusaurusContext();
  const giscusConfig = siteConfig.themeConfig?.giscus;

  return (
    <div className="althruist-card margin-top--xl" style={{padding: '1.75rem'}}>
      <Giscus
        id="comments"
        repo={giscusConfig?.repo || 'Manhddm/manhddm.github.io'}
        repoId={giscusConfig?.repoId || 'R_kgDOVsCsrA'}
        category={giscusConfig?.category || 'General'}
        categoryId={giscusConfig?.categoryId || 'DIC_kwDOVsCsrM4DK_Cj'}
        mapping="pathname"
        strict="0"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        theme={colorMode === 'dark' ? 'dark_dimmed' : 'light'}
        lang="vi"
        loading="lazy"
      />
    </div>
  );
}
