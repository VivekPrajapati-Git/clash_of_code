import React from 'react'
import { LoginForm } from './_components/login-form'
import { HeartPlus } from 'lucide-react'

const page = () => {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">

            <div className="w-full max-w-sm">
                <h1 className='text-2xl mx-auto w-48 my-4 text-pretty font-bold flex items-center'>Health
                    <span className='text-primary'>Care</span>
                    <HeartPlus className='size-6 text-red-600'></HeartPlus>
                </h1>
                <LoginForm />
            </div>
        </div>
    )
}

export default page
