import React from 'react';
import { Wallet, PlusCircle, Search } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
              <div className="bg-emerald-500 p-2 rounded-lg text-white">
                <Wallet size={24} />
              </div>
              <span className="font-bold text-xl text-gray-800">Workigom</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
             {location.pathname !== '/add' && (
                <Link 
                  to="/add" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  İlan Ekle
                </Link>
             )}
          </div>
        </div>
      </div>
    </nav>
  );
};