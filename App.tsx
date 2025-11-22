
import React, { useState } from 'react';
import { MOCK_USERS } from './constants';
import { store } from './services/mockStore';
import { UserRole, User } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AlertBanner } from './components/AlertBanner';
import { AiAssistant } from './components/AiAssistant';
import { DemoControls } from './components/DemoControls';
import { BankDashboard } from './pages/BankDashboard';
import { OpsDashboard } from './pages/OpsDashboard';
import { AdvocateDashboard } from './pages/AdvocateDashboard';
import { AssignmentDetails } from './pages/AssignmentDetails';
import { MasterManagement } from './pages/MasterManagement';
import { Reports } from './pages/Reports';
import { ActionRequired } from './pages/ActionRequired';
import { AdvocateNetwork } from './pages/AdvocateNetwork';

const App: React.FC = () => {
  // Mock Auth State
  const [user, setUser] = useState<User>(MOCK_USERS[0]); // Default to Bank User
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState('dashboard');

  // Resolve the full assignment object for the AI Assistant context
  const selectedAssignment = selectedAssignmentId ? store.getAssignmentById(selectedAssignmentId) : undefined;

  const handleSwitchUser = (role: UserRole) => {
    const newUser = MOCK_USERS.find(u => u.role === role);
    if (newUser) {
        setUser(newUser);
        setSelectedAssignmentId(null); // Reset view when switching user
        setActiveModule('dashboard');
    }
  };

  const handleModuleChange = (moduleId: string) => {
    setActiveModule(moduleId);
    setSelectedAssignmentId(null); // Go back to dashboard view when menu clicked
  };

  const handleNotificationClick = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId);
  };

  // Render content based on role and navigation state
  const renderMainContent = () => {
    if (selectedAssignmentId) {
        return (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <AssignmentDetails
                  assignmentId={selectedAssignmentId}
                  currentUser={user}
                  onBack={() => setSelectedAssignmentId(null)}
              />
            </div>
        );
    }

    // Handle specific module routes
    if (activeModule === 'masters' && user.role === UserRole.CT_OPS) {
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <MasterManagement />
          </div>
        );
    }

    if (activeModule === 'reports') {
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Reports user={user} />
          </div>
        );
    }

    if (activeModule === 'actions' && user.role === UserRole.BANK_USER) {
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <ActionRequired user={user} onSelectAssignment={setSelectedAssignmentId} />
          </div>
        );
    }

    if (activeModule === 'advocates' && user.role === UserRole.CT_OPS) {
        return (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <AdvocateNetwork />
          </div>
        );
    }

    // Default dashboard routes by role
    switch (user.role) {
      case UserRole.BANK_USER:
        return <BankDashboard user={user} onSelectAssignment={setSelectedAssignmentId} initialView={activeModule === 'fetch' ? 'claim-form' : 'dashboard'} />;
      case UserRole.CT_OPS:
        return <OpsDashboard onSelectAssignment={setSelectedAssignmentId} />;
      case UserRole.ADVOCATE:
        return <AdvocateDashboard user={user} onSelectAssignment={setSelectedAssignmentId} />;
      default:
        return (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Access Denied</h3>
              <p className="text-slate-500">You don't have permission to view this page</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Header
        currentUser={user}
        onLogout={() => alert("Logged out")}
        onSwitchUser={handleSwitchUser}
      />

      <div className="flex flex-1">
        <Sidebar
            user={user}
            activeModule={activeModule}
            onSelectModule={handleModuleChange}
        />

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <AlertBanner user={user} onOpenAssignment={handleNotificationClick} />
            <div className="p-4 sm:p-6 lg:p-8 overflow-auto">
                {renderMainContent()}
            </div>
        </main>
      </div>

      {/* Global AI Assistant - Persists across pages */}
      <AiAssistant user={user} assignment={selectedAssignment} />

      {/* Demo Controls - Data management for demo purposes */}
      <DemoControls />
    </div>
  );
};

export default App;
