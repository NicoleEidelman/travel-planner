// server/services/images.js
// Returns URL for cover image without requiring API keys. Adds keywords, fixed size, and cache-busting.
export function coverImageFor(label = '', opts = {}) {
  const base = String(label || '').trim();
  if (!base) return 'https://source.unsplash.com/featured/1200x630/?travel,city&sig=' + (Date.now() % 10000);
  
  // Clean up the label - remove Hebrew/non-Latin characters and use English equivalent
  const cityMapping = {
    'תל־אביב–יפו': 'Tel Aviv',
    'תל אביב': 'Tel Aviv',
    'ירושלים': 'Jerusalem',
    'חיפה': 'Haifa',
    'באר שבע': 'Beersheba'
  };
  
  let cleanLabel = base;
  for (const [hebrew, english] of Object.entries(cityMapping)) {
    if (base.includes(hebrew)) {
      cleanLabel = english;
      break;
    }
  }
  
  // Extract just the city name (before any commas)
  cleanLabel = cleanLabel.split(',')[0].trim();
  
  const topic = opts.topic ?? 'landmark,cityscape,skyline';
  const size  = opts.size  ?? '1200x630';
  const sig   = Date.now() % 10000; // Cache busting

  // Encode the search terms properly
  const searchTerms = `${cleanLabel},${topic}`;
  
  return `https://source.unsplash.com/featured/${size}/?${encodeURIComponent(searchTerms)}&sig=${sig}`;
}