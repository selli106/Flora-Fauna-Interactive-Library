import React, { useState, useEffect, useMemo } from 'react';
import { Species } from './types';
import { csvData } from './services/data';
import { parseCSV } from './services/csvParser';
import { fetchSpeciesImageUrl } from './services/imageFetcher';
import SpeciesList from './components/SpeciesList';
import SpeciesDetail from './components/SpeciesDetail';

// For JSZip from CDN
declare var JSZip: any;

const App: React.FC = () => {
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [kingdomFilter, setKingdomFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    try {
      const parsedData = parseCSV(csvData);
      setAllSpecies(parsedData);
      if (parsedData.length > 0) {
        setSelectedSpecies(parsedData[0]);
      }
    } catch (error) {
      console.error("Failed to parse CSV data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const kingdoms = useMemo(() => {
    if (isLoading) return [];
    const kingdomSet = new Set(allSpecies.map(s => s.kingdom).filter(k => k));
    return ['All', ...Array.from(kingdomSet).sort()];
  }, [allSpecies, isLoading]);

  const filteredSpecies = useMemo(() => {
    return allSpecies.filter(s => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (s.speciesName?.toLowerCase().includes(searchLower) ||
                             s.vernacularName?.toLowerCase().includes(searchLower));
      const matchesKingdom = kingdomFilter === 'All' || s.kingdom === kingdomFilter;
      return matchesSearch && matchesKingdom;
    });
  }, [allSpecies, searchTerm, kingdomFilter]);
  
  const handleSelectSpecies = (species: Species) => {
    setSelectedSpecies(species);
  };
  
  const createSpeciesHtml = (species: Species, imagePath: string | null, offlineContent: { hasOfflineWiki: boolean }): string => {
    const { speciesName, vernacularName, scientificNameAuthorship, kingdom, phylum, 'class': speciesClass, order, family, genus } = species;
    
    const conservationStatuses = Object.entries(species)
      .filter(([key, value]) => (key.toLowerCase().includes('status') || key.toLowerCase().includes('threatened')) && value)
      .map(([key, value]) => {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/Conservation Status|:|Priority/gi, '').trim();
        return `<li><strong>${formattedKey}:</strong> ${value}</li>`;
      }).join('');

    const biodiversityUrl = `https://biodiversity.org.au/afd/taxa/${species.speciesName.replace(/ /g, '_')}`;
    const wikipediaUrl = offlineContent.hasOfflineWiki ? './wikipedia.html' : `https://en.wikipedia.org/wiki/${encodeURIComponent(speciesName)}`;
    const iNaturalistUrl = `https://www.inaturalist.org/taxa/search?q=${encodeURIComponent(speciesName)}`;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${vernacularName || speciesName}</title>
          <style> body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; margin: 0 auto; max-width: 800px; padding: 2em; } img { max-width: 100%; height: auto; border-radius: 8px; } h1, h2 { border-bottom: 1px solid #eaeaea; padding-bottom: 0.5em;} ul { padding-left: 1.5em; } </style>
      </head>
      <body>
          <h1>${vernacularName || speciesName}</h1>
          <p><em>${speciesName} ${scientificNameAuthorship || ''}</em></p>
          ${imagePath ? `<img src="${imagePath}" alt="Image of ${vernacularName || speciesName}">` : '<p>Image not available.</p>'}
          
          <h2>Taxonomy</h2>
          <ul>
              <li><strong>Kingdom:</strong> ${kingdom || 'N/A'}</li>
              <li><strong>Phylum:</strong> ${phylum || 'N/A'}</li>
              <li><strong>Class:</strong> ${speciesClass || 'N/A'}</li>
              <li><strong>Order:</strong> ${order || 'N/A'}</li>
              <li><strong>Family:</strong> ${family || 'N/A'}</li>
              <li><strong>Genus:</strong> ${genus || 'N/A'}</li>
          </ul>
          
          ${conservationStatuses ? `<h2>Conservation Status</h2><ul>${conservationStatuses}</ul>` : ''}

          <h2>External Links</h2>
          <ul>
              <li><a href="${biodiversityUrl}" target="_blank">Biodiversity.org.au (Requires Internet)</a></li>
              <li><a href="${wikipediaUrl}" target="_blank">Wikipedia ${offlineContent.hasOfflineWiki ? '(Offline Copy)' : '(Requires Internet)'}</a></li>
              <li><a href="${iNaturalistUrl}" target="_blank">iNaturalist (Requires Internet)</a></li>
          </ul>
      </body>
      </html>
    `;
  };
  
  const fetchAndProcessWikipediaPage = async (speciesName: string): Promise<string | null> => {
    try {
      const searchName = encodeURIComponent(speciesName.split('(')[0].trim());
      const wikiApiUrl = `https://en.wikipedia.org/w/api.php?action=parse&page=${searchName}&prop=text&format=json&origin=*`;
      const response = await fetch(wikiApiUrl);
      if (!response.ok) return null;
  
      const data = await response.json();
      if (data.error) {
        console.warn(`Wikipedia API error for ${speciesName}: ${data.error.info}`);
        return null;
      }
  
      let htmlContent = data.parse?.text?.['*'];
      if (!htmlContent) return null;
  
      // Process HTML: make relative links absolute and fix protocol-relative URLs
      htmlContent = htmlContent
        .replace(/href="\/wiki\//g, 'href="https://en.wikipedia.org/wiki/')
        .replace(/src="\/\//g, 'src="https://');
  
      const fullHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Wikipedia: ${speciesName}</title>
            <style>
                body { font-family: sans-serif; line-height: 1.6; margin: 0 auto; max-width: 800px; padding: 2em; color: #333; background-color: #fff; }
                a { color: #0645ad; }
                img { max-width: 100%; height: auto; }
                .infobox { border: 1px solid #a2a9b1; background-color: #f8f9fa; padding: 1em; margin: 0 0 1em 1em; float: right; clear: right; max-width: 300px; font-size: 0.9em; }
                h1, h2, h3 { border-bottom: 1px solid #a2a9b1; padding-bottom: 0.2em; color: #000; }
                .mw-editsection, .mw-kartographer-maplink { display: none; }
            </style>
        </head>
        <body>
            <h1>Offline copy of Wikipedia's "${speciesName}" page</h1>
            <p><em>Some elements may not display correctly. For the full experience, <a href="https://en.wikipedia.org/wiki/${searchName}" target="_blank">visit the original page online</a>.</em></p>
            <hr>
            ${htmlContent}
        </body>
        </html>
      `;
      return fullHtml;
    } catch (error) {
      console.error(`Failed to fetch/process Wikipedia page for ${speciesName}:`, error);
      return null;
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    const zip = new JSZip();
    const rootFolder = zip.folder("Flora_and_Fauna_Offline_Library");

    let rootIndexHtml = `
      <!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Offline Library Index</title><style>body { font-family: sans-serif; line-height: 1.6; padding: 2em; } ul { list-style: none; padding: 0; } li { margin: 0.5em 0; } a { text-decoration: none; color: #0066cc; } a:hover { text-decoration: underline; }</style></head><body>
      <h1>Flora & Fauna Interactive Library</h1><p>This is an offline archive. Select a species to view its details. Some external links on detail pages require an internet connection.</p><ul>`;

    for (let i = 0; i < allSpecies.length; i++) {
      const species = allSpecies[i];
      const safeFolderName = (species.vernacularName || species.speciesName).replace(/[^a-zA-Z0-9]/g, '_');
      const speciesFolder = rootFolder.folder(safeFolderName);
      
      const imageUrl = await fetchSpeciesImageUrl(species);
      let localImagePath = null;

      if (imageUrl) {
        try {
          const response = await fetch(imageUrl);
          if (response.ok) {
            const blob = await response.blob();
            const extension = new URL(imageUrl).pathname.split('.').pop() || 'jpg';
            localImagePath = `image.${extension}`;
            speciesFolder.file(localImagePath, blob);
          }
        } catch (error) {
          console.error(`Failed to download image for ${species.speciesName}:`, error);
        }
      }
      
      const wikipediaHtml = await fetchAndProcessWikipediaPage(species.speciesName);
      let hasOfflineWiki = false;
      if (wikipediaHtml) {
          speciesFolder.file("wikipedia.html", wikipediaHtml);
          hasOfflineWiki = true;
      }

      const speciesHtml = createSpeciesHtml(species, localImagePath, { hasOfflineWiki });
      speciesFolder.file("index.html", speciesHtml);

      rootIndexHtml += `<li><a href="./${safeFolderName}/index.html">${species.vernacularName || species.speciesName}</a></li>`;
      setDownloadProgress(Math.round(((i + 1) / allSpecies.length) * 100));
    }

    rootIndexHtml += `</ul></body></html>`;
    rootFolder.file("index.html", rootIndexHtml);

    zip.generateAsync({ type: "blob" }).then((content: any) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = "flora_fauna_offline.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      setIsDownloading(false);
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-2xl">Loading Species Library...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen font-sans">
      <header className="bg-gray-800 text-white p-4 shadow-lg flex-shrink-0">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Flora & Fauna Interactive Library</h1>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            {isDownloading ? `Downloading... ${downloadProgress}%` : 'Download Offline Pack'}
          </button>
        </div>
      </header>
      <div className="flex flex-grow overflow-hidden">
        <aside className="w-full md:w-1/3 lg:w-1/4 bg-gray-800 flex flex-col overflow-hidden">
          <SpeciesList
            speciesList={filteredSpecies}
            kingdoms={kingdoms}
            selectedSpecies={selectedSpecies}
            onSelect={handleSelectSpecies}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            kingdomFilter={kingdomFilter}
            onKingdomFilterChange={setKingdomFilter}
          />
        </aside>
        <main className="w-full md:w-2/3 lg:w-3/4 bg-gray-900 overflow-y-auto">
          <SpeciesDetail species={selectedSpecies} />
        </main>
      </div>
    </div>
  );
};

export default App;
