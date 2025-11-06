
import React, { useState, useEffect, useMemo } from 'react';
import { Species } from './types';
import { csvData } from './services/data';
import { parseCSV } from './services/csvParser';
import SpeciesList from './components/SpeciesList';
import SpeciesDetail from './components/SpeciesDetail';

const App: React.FC = () => {
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [kingdomFilter, setKingdomFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

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
        <h1 className="text-2xl font-bold">Flora & Fauna Interactive Library</h1>
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
