export function transformUrlWithVersion(urlString: string) {
  try {
    const url = new URL(urlString);

    if (url.href.includes('|')) {
      const [, version] = url.href.split('|');
      if (version) {
        const urlStringWithoutVersion = urlString.split('|')[0];
        return `${urlStringWithoutVersion}&version=${encodeURIComponent(version)}`;
      }
    }

    return urlString;
  } catch (error) {
    console.error('Error while transforming URL with version, omitting version:', error);

    // Return the original URL without the piped version
    return urlString.split('|')[0];
  }
}
