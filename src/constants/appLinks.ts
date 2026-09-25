export const GITHUB_REPOSITORY = 'shamsfarabii/Arabiyyah' as const;

export const GITHUB_RELEASES_PAGE_URL =
  `https://github.com/${GITHUB_REPOSITORY}/releases/latest` as const;

export const RELEASE_APK_ASSET_NAME = 'my-arabic.apk' as const;

export const LATEST_APK_DOWNLOAD_URL =
  `${GITHUB_RELEASES_PAGE_URL}/download/${RELEASE_APK_ASSET_NAME}` as const;
