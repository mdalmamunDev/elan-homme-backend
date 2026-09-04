export const buildCacheKey = (
  prefix: string,
  userId: string,
  query: Record<string, any>
) => {
  const queryString = Object.keys(query)
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');

  return `${prefix}:${userId}:${queryString}`;
};
