'use client'

import { useState } from 'react'

export default function TestClientPage() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Test Client Page</h1>
        <p className="text-muted-foreground mt-2">
          This is a client component to test routing.
        </p>
        <button 
          onClick={() => setCount(count + 1)}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          Count: {count}
        </button>
      </div>
    </div>
  )
}