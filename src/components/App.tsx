import React from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, Settings, LogOut, Menu, Bell, User, LayoutDashboard, Users, Calendar, FlaskConical, Package, MessageSquare, TrendingUp, UserCog, Boxes, FileText, Plug, CreditCard } from 'lucide-react';
import MedicationManager from './MedicationManager';
import { MarekLogo } from './MarekLogo';

const sidebarItems = [
  { name: "Dashboard", icon: "📊", active: false },
  { name: "Patients", icon: "👥", active: false },
  { name: "Appointments", icon: "📅", active: false },
  { name: "Lab Results", icon: "🧪", active: false },
  { name: "Prescriptions", icon: "💊", active: false },
  { name: "Communications", icon: "💬", active: false },
  { name: "Reports", icon: "📈", active: false },
];

const settingsItems = [
  { name: "User Management", icon: "⚙️", active: false },
  { name: "Inventory", icon: "⚙️", active: true },
  { name: "Templates", icon: "⚙️", active: false },
  { name: "Integrations", icon: "⚙️", active: false },
  { name: "Billing", icon: "⚙️", active: false },
];

function App() {
  return (
    <div className="flex h-screen bg-marek-gray-800">
      {/* Sidebar */}
      <div className="w-80 bg-marek-gray-900 border-r border-marek-gray-700">
        {/* User Profile */}
        <div className="p-6 border-b border-marek-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-marek-gray-700 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-marek-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-marek-white">Nick Rose</div>
              <div className="text-xs text-marek-gray-400">System Administrator</div>
            </div>
            <button
              type="button"
              className="text-marek-gray-400 hover:text-marek-white cursor-pointer"
              aria-label="Open user menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="p-6">
          <div className="text-xs font-bold text-marek-gray-400 mb-4 tracking-wider uppercase">Main Menu</div>
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <div
                key={item.name}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm cursor-pointer transition-all ${
                  item.active
                    ? "bg-marek-red text-marek-white"
                    : "text-marek-gray-300 hover:bg-marek-gray-850 hover:text-marek-white"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </div>
            ))}
          </nav>
        </div>

        {/* Settings Section */}
        <div className="p-6">
          <div className="text-xs font-bold text-marek-gray-400 mb-4 tracking-wider uppercase">Settings</div>
          <nav className="space-y-2">
            {settingsItems.map((item) => (
              <div
                key={item.name}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm cursor-pointer transition-all ${
                  item.active
                    ? "bg-marek-red text-marek-white"
                    : "text-marek-gray-300 hover:bg-marek-gray-850 hover:text-marek-white"
                }`}
              >
                <span className="text-lg">⚙️</span>
                <span className="font-medium">{item.name}</span>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="text-xs text-marek-gray-500 text-center">© 2025 Marek Health. All rights reserved.</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <div className="bg-marek-gray-900 border-b border-marek-gray-800 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <MarekLogo />
              <div className="text-sm text-marek-gray-400 font-medium">Inventory Management System</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-marek-gray-400" />
                <Input
                  placeholder="Global search..."
                  className="w-80 bg-marek-gray-800 border-marek-gray-600 pl-10 text-marek-white placeholder-marek-gray-400 focus:border-marek-red focus:ring-marek-red/20 rounded-lg"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-marek-gray-400 hover:text-marek-white hover:bg-marek-gray-800 p-2 rounded-lg"
              >
                <Bell className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-marek-gray-400 hover:text-marek-white hover:bg-marek-gray-800 p-2 rounded-lg"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-marek-gray-400 hover:text-marek-white hover:bg-marek-gray-800 p-2 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-marek-gray-800 p-8 overflow-auto">
          {/* Breadcrumb & Title */}
          <div className="mb-8">
            <div className="text-sm text-marek-gray-500 mb-3 font-medium">Settings / Inventory Management</div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-marek-white rounded-xl flex items-center justify-center shadow-sm border border-marek-gray-200">
                <span className="text-xl">📋</span>
              </div>
              <h1 className="text-4xl font-bold text-marek-white">Inventory Management</h1>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 mb-8 border-b border-marek-gray-700">
            <button className="pb-4 px-2 border-b-3 border-marek-red text-marek-red font-bold text-lg">Items</button>
            <button className="pb-4 px-2 text-marek-gray-400 hover:text-marek-gray-300 font-bold text-lg">
              Vendors
            </button>
          </div>

          {/* Main Content */}
          <MedicationManager />
        </div>
      </div>
    </div>
  );
}

export default App;
