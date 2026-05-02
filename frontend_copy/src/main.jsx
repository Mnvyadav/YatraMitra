import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Itinerary from './itinerary.jsx'
import SavedTrips from './SavedTrips.jsx'
import { BrowserRouter, Routes, Route } from "react-router-dom"

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/itinerary" element={<Itinerary />} />
      <Route path="/saved" element={<SavedTrips />} />
    </Routes>
  </BrowserRouter>
)