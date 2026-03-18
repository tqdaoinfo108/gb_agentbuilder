import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Builder from './pages/Builder';
import Runner from './pages/Runner';
import Portal from './pages/Portal';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/run/:id" element={<Runner />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
