import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import { AuthApp } from './components/SystemScreens'
import { AdminAppPage } from './surfaces/admin/AdminApp'
import { CoachAppPage } from './surfaces/coach/CoachApp'
import { AthleteAppPage } from './surfaces/athlete/AthleteApp'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthApp />} />
        <Route path="/admin" element={<AdminAppPage />} />
        <Route path="/coach" element={<CoachAppPage />} />
        <Route path="/athlete" element={<AthleteAppPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
