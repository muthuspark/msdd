const prefix = '/specs/';

function validPath(value, { markdown = false } = {}) {
  if (typeof value !== 'string' || !value || value.startsWith('/') || value.endsWith('/')) return false;
  const segments = value.split('/');
  return segments.every((segment) => segment && segment !== '.' && segment !== '..' && !/[\\\0]/.test(segment)) && (!markdown || value.endsWith('.md'));
}

function decodeSegment(segment) {
  try { return decodeURIComponent(segment); } catch { return null; }
}

export function routeFor(feature, file) {
  if (!validPath(feature?.path) || !validPath(file?.relativePath, { markdown: true })) return null;
  const featurePrefix = feature.path === 'root' ? '' : `${feature.path}/`;
  if (!file.relativePath.startsWith(featurePrefix)) return null;
  return `${prefix}${encodeURIComponent(feature.path)}/${encodeURIComponent(file.relativePath)}`;
}

export function parseRoute(pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith(prefix)) return null;
  const parts = pathname.slice(prefix.length).split('/');
  if (parts.length !== 2 || parts.some((part) => !part)) return null;
  const featurePath = decodeSegment(parts[0]);
  const relativePath = decodeSegment(parts[1]);
  if (!validPath(featurePath) || !validPath(relativePath, { markdown: true })) return null;
  const featurePrefix = featurePath === 'root' ? '' : `${featurePath}/`;
  if (!relativePath.startsWith(featurePrefix)) return null;
  return { featurePath, relativePath };
}

export function resolveRoute(features, route) {
  if (!route || !Array.isArray(features)) return null;
  const feature = features.find((item) => item.path === route.featurePath);
  const file = feature?.files.find((item) => item.relativePath === route.relativePath);
  return file ? { feature, file } : null;
}
