import React, { useState, useEffect } from 'react';
import { Species } from '../types';
import { fetchSpeciesImageUrl } from '../services/imageFetcher';

interface Props {
  species: Species | null;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-cyan-400 mb-2 border-b border-gray-700 pb-1">{title}</h3>
      {children}
    </div>
);

const DetailRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex justify-between py-1 text-sm">
            <span className="text-gray-400">{label}:</span>
            <span className="text-gray-200 text-right">{value}</span>
        </div>
    );
};

const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || 'w-4 h-4 ml-2'}>
    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
  </svg>
);


const SpeciesDetail: React.FC<Props> = ({ species }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!species) return;

    const getImage = async () => {
      setIsImageLoading(true);
      const url = await fetchSpeciesImageUrl(species);
      setImageUrl(url);
      setIsImageLoading(false);
    };

    getImage();
  }, [species]);


  if (!species) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p className="text-xl">Select a species from the list to see details.</p>
      </div>
    );
  }

  const {
    speciesName,
    vernacularName,
    scientificNameAuthorship,
    kingdom,
    phylum,
    'class': speciesClass,
    order,
    family,
    genus,
    numberOfRecords
  } = species;

  const conservationStatuses = Object.entries(species)
    .filter(([key, value]) => (key.toLowerCase().includes('status') || key.toLowerCase().includes('threatened')) && value)
    .map(([key, value]) => {
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/Conservation Status|status|:|Priority/gi, '')
        .replace(/Epbc/i, 'EPBC')
        .trim();
      return { region: formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1), status: value };
    })
    .filter(item => item.region !== "Western Australia");

  const specialMentions = Object.entries(species)
    .filter(([key, value]) => (key.toLowerCase().includes('agreement') || key.toLowerCase().includes('taxa') || key.toLowerCase().includes('wons') || key.toLowerCase().includes('pests') || key.toLowerCase().includes('list')) && value)
    .map(([key, value]) => {
         const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/\(ROKAMBA\)| \(CAMBA\)| \(JAMBA\)| \(WoNS\)|as at Feb\. 2013| \(ABS\)/gi, '')
        .trim();
      return { mention: formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1), value: value };
    });
  
  const biodiversityUrl = `https://biodiversity.org.au/afd/taxa/${species.speciesName.replace(/ /g, '_')}`;
  const wikipediaUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(speciesName)}`;
  const iNaturalistUrl = `https://www.inaturalist.org/taxa/search?q=${encodeURIComponent(speciesName)}`;

  return (
    <div className="p-4 md:p-6 lg:p-8 text-gray-200">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white">{vernacularName || speciesName}</h1>
            <p className="text-xl italic text-gray-400 mt-1 mb-6">{speciesName} <span className="text-base not-italic">{scientificNameAuthorship}</span></p>

            <div className="aspect-w-16 aspect-h-9 mb-6 bg-gray-800 rounded-lg shadow-lg flex items-center justify-center min-h-[200px]">
                {isImageLoading ? (
                  <div className="text-gray-400">Loading image...</div>
                ) : imageUrl ? (
                  <img
                      src={imageUrl}
                      alt={`Illustration of ${vernacularName || speciesName}`}
                      className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-gray-500 text-center p-4">
                      <p>Image not available</p>
                      <p className="text-sm">(Illustration of {vernacularName || speciesName})</p>
                  </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard title="Taxonomy">
                   <DetailRow label="Kingdom" value={kingdom}/>
                   <DetailRow label="Phylum" value={phylum}/>
                   <DetailRow label="Class" value={speciesClass}/>
                   <DetailRow label="Order" value={order}/>
                   <DetailRow label="Family" value={family}/>
                   <DetailRow label="Genus" value={genus}/>
                </InfoCard>

                <InfoCard title="Records">
                   <DetailRow label="Number of records" value={numberOfRecords}/>
                   {specialMentions.map(({mention, value}) => (
                       <DetailRow key={mention} label={mention} value={value === 'Y' ? 'Yes' : value} />
                   ))}
                </InfoCard>

                 {conservationStatuses.length > 0 && (
                     <InfoCard title="Conservation Status">
                         {conservationStatuses.map(({ region, status }) => (
                            <DetailRow key={region} label={region} value={status} />
                         ))}
                    </InfoCard>
                )}

                 <InfoCard title="External Links">
                     <div className="flex flex-col space-y-2">
                        <a href={biodiversityUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-2 bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors duration-200">
                            Biodiversity.org.au <ExternalLinkIcon />
                        </a>
                        <a href={wikipediaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-2 bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors duration-200">
                            Wikipedia <ExternalLinkIcon />
                        </a>
                        <a href={iNaturalistUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-2 bg-cyan-600 hover:bg-cyan-500 rounded-md transition-colors duration-200">
                            iNaturalist <ExternalLinkIcon />
                        </a>
                     </div>
                </InfoCard>
            </div>
        </div>
    </div>
  );
};

export default SpeciesDetail;