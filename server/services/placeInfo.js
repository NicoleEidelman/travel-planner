import fetch from 'node-fetch';
import { coverImageFor } from './images.js';

// Returns { cover, description } for a place using Wikipedia, with Unsplash fallback
export async function placeInfoFor(query) {
  if (!query) return { cover: coverImageFor('travel'), description: '' };

  // Clean the query and extract the main city name
  const cleanQuery = query.split(',')[0].trim();
  
  // Create a mapping for common non-English city names to English Wikipedia titles
  const cityMapping = {
    'תל־אביב–יפו': 'Tel Aviv',
    'תל אביב': 'Tel Aviv',
    'ירושלים': 'Jerusalem',
    'חיפה': 'Haifa',
    'באר שבע': 'Beersheba',
    'פריז': 'Paris',
    'לונדון': 'London',
    'ברלין': 'Berlin',
    'רומא': 'Rome',
    'מדריד': 'Madrid',
    'אמסטרדם': 'Amsterdam',
    'וינה': 'Vienna',
    'פראג': 'Prague',
    'בודפשט': 'Budapest',
    'ורשה': 'Warsaw',
    'מוסקבה': 'Moscow',
    'סטוקהולם': 'Stockholm',
    'קופנהגן': 'Copenhagen',
    'הלסינקי': 'Helsinki',
    'אתונה': 'Athens',
    'ליסבון': 'Lisbon',
    'דבלין': 'Dublin',
    'אדינבורו': 'Edinburgh',
    'גלזגו': 'Glasgow',
    'מנצ\'סטר': 'Manchester',
    'ליברפול': 'Liverpool',
    'ברמינגהם': 'Birmingham',
    'ליידס': 'Leeds',
    'שפילד': 'Sheffield',
    'ברדפורד': 'Bradford',
    'ליסטר': 'Leicester',
    'קובנטרי': 'Coventry',
    'קינגסטון על האל': 'Kingston upon Hull',
    'סטוק און טרנט': 'Stoke-on-Trent',
    'דרבי': 'Derby',
    'סאות\'המפטון': 'Southampton',
    'פורטסמות\'': 'Portsmouth',
    'יורק': 'York',
    'קנטרברי': 'Canterbury',
    'באת\'': 'Bath',
    'צ\'סטר': 'Chester',
    'לינקולן': 'Lincoln',
    'וינצ\'סטר': 'Winchester',
    'אוקספורד': 'Oxford',
    'קיימברידג\'': 'Cambridge',
    'ברייטון': 'Brighton',
    'נוריץ\'': 'Norwich',
    'פטרבורו': 'Peterborough'
  };

  // Use mapped name if available, otherwise use the original
  const englishName = cityMapping[cleanQuery] || cleanQuery;
  
  const variations = [
    englishName,
    englishName.replace(/\s+/g, '_'), // Replace spaces with underscores
    englishName.replace(/\s+/g, ''), // Remove spaces entirely
  ];

  // For Tel Aviv specifically, try the common variations
  if (englishName.toLowerCase().includes('tel aviv') || cleanQuery.includes('תל')) {
    variations.push('Tel_Aviv', 'Tel_Aviv-Yafo', 'Tel Aviv-Yafo', 'Tel_Aviv-Jaffa');
  }

  for (const title of variations) {
    try {
      const encodedTitle = encodeURIComponent(title);
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`,
        { 
          headers: { 
            accept: 'application/json',
            'User-Agent': 'TravelPlannerMVP/1.0' 
          } 
        }
      );
      
      if (res.ok) {
        const j = await res.json();
        
        // Check if we got a valid page (not a disambiguation or error)
        if (j.type === 'standard' && j.extract) {
          const cover = j.thumbnail?.source || coverImageFor(query);
          const description = j.extract.slice(0, 400);
          
          console.log(`Wikipedia success for "${title}":`, { 
            hasImage: !!j.thumbnail?.source, 
            description: description.substring(0, 50) + '...' 
          });
          
          return { cover, description };
        }
      }
    } catch (error) {
      console.log(`Wikipedia attempt failed for "${title}":`, error.message);
      // Continue to next variation
    }
  }

  // If all Wikipedia attempts fail, use Unsplash fallback
  console.log(`All Wikipedia attempts failed for "${cleanQuery}", using Unsplash fallback`);
  const fallbackCover = coverImageFor(englishName || cleanQuery);
  console.log(`Fallback cover URL: ${fallbackCover}`);
  
  return { 
    cover: fallbackCover, 
    description: `Explore the beautiful area around ${englishName || cleanQuery}.` 
  };
}