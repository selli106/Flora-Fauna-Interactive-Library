import { Species } from '../types';

export const fetchSpeciesImageUrl = async (species: Species): Promise<string | null> => {
  if (!species?.speciesName) {
    return null;
  }

  const searchName = encodeURIComponent(species.speciesName.split('(')[0].trim());

  // --- 1. Try Wikipedia ---
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${searchName}&prop=pageimages&format=json&pithumbsize=1200&origin=*`;
    const response = await fetch(wikiUrl);
    if (!response.ok) throw new Error('Wikipedia API response not OK');
    
    const data = await response.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];

    if (pageId !== '-1') {
      const imageUrlFromWiki = pages[pageId]?.thumbnail?.source;
      if (imageUrlFromWiki) {
        return imageUrlFromWiki;
      }
    }
  } catch (error) {
    console.warn(`Failed to fetch image from Wikipedia for "${species.speciesName}", trying iNaturalist.`, error);
  }

  // --- 2. Fallback to iNaturalist ---
  try {
    const iNatTaxaUrl = `https://api.inaturalist.org/v1/taxa?q=${searchName}`;
    const taxaResponse = await fetch(iNatTaxaUrl);
    if (!taxaResponse.ok) throw new Error('iNaturalist Taxa API response not OK');

    const taxaData = await taxaResponse.json();
    if (taxaData.results && taxaData.results.length > 0) {
      const taxon = taxaData.results[0];
      const imageUrlFromINat = taxon.default_photo?.large_url || taxon.default_photo?.medium_url;
      if (imageUrlFromINat) {
        return imageUrlFromINat;
      }
    }
  } catch (error) {
    console.error(`Failed to fetch image from iNaturalist for "${species.speciesName}".`, error);
  }

  // --- 3. Final Fallback (No Image) ---
  return null;
};
