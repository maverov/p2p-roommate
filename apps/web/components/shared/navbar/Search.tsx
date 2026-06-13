'use client';

import { Search as SearchIcon } from 'lucide-react';

export function Search() {
  return (
    <div className="w-full md:w-auto border border-gray-200 rounded-full shadow-sm hover:shadow-md transition cursor-pointer">
      <div className="flex flex-row items-center divide-x divide-gray-200">
        <div className="text-sm font-semibold px-5 py-3 whitespace-nowrap">
          Anywhere
        </div>

        <div className="hidden sm:block text-sm font-semibold px-5 py-3 whitespace-nowrap">
          Any week
        </div>

        <div className="flex items-center gap-3 pl-5 pr-2 py-2">
          <span className="hidden sm:block text-sm text-gray-500 whitespace-nowrap">
            Add Guests
          </span>
          <div className="p-2 bg-rose-500 rounded-full text-white">
            <SearchIcon size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Search;