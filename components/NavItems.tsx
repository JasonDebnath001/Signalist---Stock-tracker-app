'use client'
import { NAV_ITEMS } from '@/lib/constants'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const NavItems = () => {
    const pathName = usePathname()

    const isActive = (path: string) => {
        if(path === '/') return pathName === '/'

        return pathName.startsWith(path)
    }
  return (
    <ul className='flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium'>
        {NAV_ITEMS.map((ITEM) => (
            <li key={ITEM.href}>
                <Link href={ITEM.href} className={`hover:text-yellow-500 transition-colors ${isActive(ITEM.href) ? 'text-gray-100' : '' }`}>{ITEM.label}</Link>
            </li>
        ))}
    </ul>
  )
}

export default NavItems