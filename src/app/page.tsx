'use client'
import dynamic from 'next/dynamic'
import {useEffect} from 'react'

const AppWithoutSSR = dynamic(() => import('./App'), {ssr: false})
// @refresh reset
export default function Home() {
    useEffect(() => {
        console.log('page says hi')
    })
    

    return (
        <main>
            <AppWithoutSSR/>
        </main>
    )
}


