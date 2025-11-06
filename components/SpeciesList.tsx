
import React from 'react';
import { Species } from '../types';

interface Props {
  speciesList: Species[];
  kingdoms: string[];
  selectedSpecies: Species | null;
  onSelect: (species: Species) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  kingdomFilter: string;
  onKingdomFilterChange: (kingdom: string) => void;
}

const SpeciesList: React.FC<Props> = ({
  speciesList,
  kingdoms,
  selectedSpecies,
  onSelect,
  searchTerm,
  onSearchChange,
  kingdomFilter,
  onKingdomFilterChange
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-gray-700/50 border-b border-gray-600">
        <input
          type="text"
          placeholder="Search species..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <div className="mt-2">
          <label htmlFor="kingdom-filter" className="text-sm text-gray-400 mr-2">Kingdom:</label>
          <select
            id="kingdom-filter"
            value={kingdomFilter}
            onChange={(e) => onKingdomFilterChange(e.target.value)}
            className="w-full p-2 bg-gray-800 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {kingdoms.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto">
        {speciesList.length > 0 ? (
          <ul>
            {speciesList.map((species) => (
              <li
                key={species.species}
                onClick={() => onSelect(species)}
                className={`p-4 cursor-pointer border-b border-gray-700 transition-colors duration-200 ${
                  selectedSpecies?.species === species.species
                    ? 'bg-cyan-600/30'
                    : 'hover:bg-gray-700/50'
                }`}
              >
                <h3 className="font-semibold text-white">{species.vernacularName || species.speciesName}</h3>
                <p className="text-sm text-gray-400 italic">{species.speciesName}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-4 text-center text-gray-500">
            No species found.
          </div>
        )}
      </div>
    </div>
  );
};

export default SpeciesList;
