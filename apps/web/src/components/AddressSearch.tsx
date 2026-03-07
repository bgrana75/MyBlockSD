'use client';

import { useState, FormEvent } from 'react';

interface Props {
  onSearch: (address: string) => void;
  isLoading: boolean;
}

export default function AddressSearch({ onSearch, isLoading }: Props) {
  const [address, setAddress] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = address.trim();
    if (trimmed) onSearch(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-xl">
      <div className="relative flex-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter a San Diego address..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface-alt text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all text-sm"
          disabled={isLoading}
        />
      </div>
      <button
        type="submit"
        disabled={isLoading || !address.trim()}
        className="px-5 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-medium hover:from-primary-light hover:to-primary disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm shadow-sm hover:shadow-lg hover:shadow-primary/20"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Searching
          </span>
        ) : 'Search'}
      </button>
    </form>
  );
}
