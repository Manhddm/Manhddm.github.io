// Safe shim cho @docusaurus/plugin-content-docs/client khi tắt tính năng docs (docs: false)
// Giúp @easyops-cn/docusaurus-search-local và @docusaurus/theme-classic hoạt động không cảnh báo.
import React from 'react';

export function DocsPreferredVersionContextProvider({children}) {
  return <>{children}</>;
}

export function useActivePlugin() {
  return undefined;
}

export function useActiveVersion() {
  return undefined;
}

export function useActivePluginAndVersion() {
  return undefined;
}

export function useDocsData() {
  return undefined;
}

export function useAllDocsData() {
  return {};
}

export function useActiveDocContext() {
  return {};
}

export function useLayoutDoc() {
  return undefined;
}

export function useLayoutDocsSidebar() {
  return {};
}

export function useVersions() {
  return [];
}

export function useLatestVersion() {
  return undefined;
}

export function useDocsVersionCandidates() {
  return [];
}

export function useDocsPreferredVersion() {
  return {preferredVersion: null, savePreferredVersionName: () => {}};
}
