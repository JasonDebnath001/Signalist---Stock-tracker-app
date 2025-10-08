import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import NavItems from './NavItems'
import UserDropdwon from './UserDropdwon'

const Header = ({user}: {user: User}) => {
  return (
    <header className='sticky top-0 header'>
        <div className='container header-wrapper'>
            <Link href={'/'}>
            <Image src={'/assets/icons/logo.svg'} alt='Signalist' width={140} height={32} className='h-8 w-auto cursor-pointer' />
            </Link>
        <nav className='hidden sm:block'>
            {/* navItems */}
            <NavItems />
        </nav>
        {/* userDropdown */}
        <UserDropdwon user={user} />
        </div>
    </header>
  )
}

export default Header