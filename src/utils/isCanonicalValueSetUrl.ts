export function isCanonicalValueSetUrl(url: string): boolean {
  try {
    const [baseUrl] = url.split('|'); // Strip version if present
    const parsed = new URL(baseUrl);

    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      /\/ValueSet(\/|$)/.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}
