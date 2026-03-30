import React, { useState, useEffect } from 'react'
import MainLayout from './Main/MainLayout.jsx'
import JatayuAuth from './Auth/AuthLayout.jsx'
import { clearSession, getSession, saveSession } from './lib/session.js'

export default function App() {
  const [session, setSession] = useState(() => getSession())

  useEffect(() => {
    if (session) saveSession(session)
    else clearSession()
  }, [session])

  const handleAuthenticated = (nextSession) => setSession(nextSession)
  const handleLogout = () => setSession(null)

  if (!session) {
    return <JatayuAuth onAuthenticated={handleAuthenticated} />
  }

  return <MainLayout session={session} onLogout={handleLogout} />
}
