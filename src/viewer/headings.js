export function headingSlug(text) {
  const value = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return value || 'section';
}

export function createHeadingMetadata(headings) {
  const used = new Map();
  return headings.flatMap(({ text, level }) => {
    const label = text.replace(/\s+/g, ' ').trim();
    if (!label) return [];
    const slug = headingSlug(label);
    const count = (used.get(slug) || 0) + 1;
    used.set(slug, count);
    return [{ id: count === 1 ? slug : `${slug}-${count}`, text: label, level }];
  });
}
