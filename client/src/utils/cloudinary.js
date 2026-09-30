export const optimizeImage = (url, width) => {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) return url;
  const transform = width ? `f_auto,q_auto,w_${width}` : 'f_auto,q_auto';
  return url.replace('/upload/', `/upload/${transform}/`);
};