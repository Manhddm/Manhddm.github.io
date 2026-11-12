// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Manhddm Unity',
  tagline: 'Mỗi ngày một kiến thức Unity',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
  },

  url: 'https://manhddm.github.io',
  baseUrl: '/',

  organizationName: 'Manhddm',
  projectName: 'manhddm.github.io',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'vi',
    locales: ['vi'],
  },

  // Tùy chọn Umami Analytics (nếu dùng Umami thay cho Google Analytics, chỉ cần bỏ comment dưới đây):
  // scripts: [
  //   {
  //     src: 'https://cloud.umami.is/script.js',
  //     defer: true,
  //     'data-website-id': 'YOUR_UMAMI_WEBSITE_ID',
  //   },
  // ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        // Đã tắt hẳn tính năng docs theo lựa chọn ở Phase 1 & Phase 4
        docs: false,
        blog: {
          blogTitle: 'Blog lập trình Unity & C#',
          blogDescription:
            'Chia sẻ kiến thức thực tế về phát triển game với Unity, C#, kiến trúc phần mềm và tối ưu hóa.',
          blogSidebarTitle: 'Bài viết gần đây',
          blogSidebarCount: 'ALL',
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/Manhddm/manhddm.github.io/tree/main/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        // Google Analytics 4 (điền mã G-XXXXXXXXXX thật hoặc đặt biến môi trường GA_TRACKING_ID)
        ...(process.env.GA_TRACKING_ID
          ? {
              gtag: {
                trackingID: process.env.GA_TRACKING_ID,
                anonymizeIP: true,
              },
            }
          : {}),
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  plugins: [
    function docsClientShimPlugin() {
      return {
        name: 'docs-client-shim-plugin',
        configureWebpack() {
          return {
            resolve: {
              alias: {
                '@docusaurus/plugin-content-docs/client': require.resolve(
                  './src/shims/docsClientShim.js',
                ),
              },
            },
          };
        },
      };
    },
  ],

  themes: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      /** @type {import("@easyops-cn/docusaurus-search-local").PluginOptions} */
      ({
        hashed: true,
        language: ['en'],
        indexDocs: false,
        indexBlog: true,
        indexPages: true,
        blogRouteBasePath: '/blog',
        removeDefaultStemmer: true,
        highlightSearchTermsOnTargetPage: true,
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/social-card.svg',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      // Cấu hình bình luận Giscus (GitHub Discussions)
      giscus: {
        repo: 'Manhddm/manhddm.github.io',
        repoId: process.env.GISCUS_REPO_ID || '', // Điền R_kgDO... từ https://giscus.app/vi
        category: 'General',
        categoryId: process.env.GISCUS_CATEGORY_ID || '', // Điền DIC_kwDO... từ https://giscus.app/vi
      },
      navbar: {
        title: 'Manhddm',
        logo: {
          alt: 'Đồng Đức Mạnh Logo',
          src: 'img/avatar.png',
        },
        items: [
          {to: '/blog', label: 'Blog', position: 'left'},
          {to: '/projects', label: 'Dự án', position: 'left'},
          {to: '/about', label: 'Giới thiệu', position: 'left'},
          {
            href: 'https://github.com/Manhddm',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Khám phá',
            items: [
              {
                label: 'Trang chủ',
                to: '/',
              },
              {
                label: 'Blog kỹ thuật',
                to: '/blog',
              },
              {
                label: 'Dự án Game (Portfolio)',
                to: '/projects',
              },
              {
                label: 'Giới thiệu (CV)',
                to: '/about',
              },
            ],
          },
          {
            title: 'Kết nối',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/Manhddm',
              },
              {
                label: 'LinkedIn',
                href: 'https://www.linkedin.com/in/m%E1%BA%A1nh-%C4%91%E1%BB%93ng-%C4%91%E1%BB%A9c-b2366b330',
              },
              {
                label: 'Facebook',
                href: 'https://web.facebook.com/dongducmanhyb',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Đồng Đức Mạnh (Manhddm). Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['csharp'],
      },
    }),
};

export default config;
