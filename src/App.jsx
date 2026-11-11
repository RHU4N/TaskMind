/**
 * @file App.jsx
 * Root application component for TaskMind — Academic Intelligence.
 * Configures React Router, AcademicProvider, Sidebar, Header and routes.
 */

import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AcademicProvider } from './context/AcademicContext.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import Header from './components/layout/Header.jsx';
import TaskModal from './components/tasks/TaskModal.jsx';

// Pages (All 6 Stitch Screens)
import DashboardPage from './pages/DashboardPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import AssistantPage from './pages/AssistantPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import SubjectsPage from './pages/SubjectsPage.jsx';
import SimulatorPage from './pages/SimulatorPage.jsx';

function MainLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex">
      {/* Navigation Dock (Sidebar) */}
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen w-full">
        {/* Top Header */}
        <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />

        {/* Routed Page Container */}
        <main className="w-full pt-16 bg-surface flex-1">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tarefas" element={<TasksPage />} />
            <Route path="/assistente" element={<AssistantPage />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/disciplinas" element={<SubjectsPage />} />
            <Route path="/simulador" element={<SimulatorPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Task Creation/Editing Modal */}
      <TaskModal />
    </div>
  );
}

export default function App() {
  return (
    <AcademicProvider>
      <BrowserRouter>
        <MainLayout />
      </BrowserRouter>
    </AcademicProvider>
  );
}
