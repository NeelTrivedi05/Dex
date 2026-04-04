import { useState } from 'react';
import clsx from 'clsx';
import TimerView from './TimerView';
import SettingsView from './SettingsView';

export default function FocusTimerApp() {
  const [activeTab, setActiveTab] = useState<'Timer' | 'Settings'>('Timer');

  return (
    <div className="h-full flex flex-col overflow-auto bg-bg-surface w-full">
      <div className="px-8 pt-8 max-w-5xl mx-auto w-full flex-1 mb-12 animate-in fade-in">
        
        {/* Top Header & Pill Container */}
        <div className="flex flex-col items-center justify-center mb-8">
           <h1 className="text-display font-bold text-text-primary tracking-tight mb-6">
              Focus Timer
           </h1>

           <div className="flex bg-bg-surface rounded-full shadow-sm border border-border-default p-1 w-[240px]">
             {['Timer', 'Settings'].map(tab => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab as 'Timer' | 'Settings')}
                 className={clsx(
                   "flex-1 py-1.5 text-sm font-bold rounded-full transition-colors",
                   activeTab === tab ? "bg-white text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                 )}
               >
                 {tab}
               </button>
             ))}
           </div>
        </div>

        {activeTab === 'Timer' ? <TimerView /> : <SettingsView />}

      </div>
    </div>
  );
}
