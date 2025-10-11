'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function SearchBar({ placeholder = "Search..." }: { placeholder?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') || '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (search) {
      params.set('q', search)
    } else {
      params.delete('q')
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-lg">
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pl-10 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </form>
  )
}
