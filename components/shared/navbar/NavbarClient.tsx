'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Menu, X, User } from 'lucide-react';
import Search from './Search';

interface NavbarClientProps {
  user: null; // expand this type when auth is wired in
}

export function NavbarClient({ user }: NavbarClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = useCallback(() => setIsOpen(prev => !prev), []);

  return (
    <>
      {/* Main bar */}
      <div className="flex items-center justify-between md:grid md:grid-cols-3 h-20">
        <Link href="/" className="text-rose-500 font-bold text-xl w-fit">
          Roommatch
        </Link>

        <div className="hidden md:flex justify-center">
          <Search />
        </div>

        <div className="flex items-center justify-end gap-2">
          <button className="hidden md:block text-sm font-medium px-4 py-2 rounded-full hover:bg-gray-100 transition whitespace-nowrap">
            Roommatch your home
          </button>

          <button
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            className="flex items-center gap-2 border border-gray-300 rounded-full px-3 py-2 hover:shadow-md transition"
          >
            {isOpen
              ? <X size={18} className="text-gray-600" />
              : <Menu size={18} className="text-gray-600" />
            }
            <div className="bg-gray-500 rounded-full p-1">
              <User size={16} className="text-white" />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div id="mobile-menu" className="md:hidden pb-4 flex flex-col gap-1 border-t border-gray-100">
          <div className="pt-4">
            <Search />
          </div>

          <hr className="my-2 border-gray-100" />

          <MobileNavItem label="Roommatch your home" />
          <MobileNavItem label="Log in" />
          <MobileNavItem label="Sign up" />
        </div>
      )}
    </>
  );
}

function MobileNavItem({ label }: { label: string }) {
  return (
    <button className="text-sm font-medium text-left w-full px-2 py-3 rounded-lg hover:bg-gray-50 text-gray-700 transition">
      {label}
    </button>
  );
}