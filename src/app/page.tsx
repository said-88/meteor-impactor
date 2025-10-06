"use client";

import { ControlPanel } from "@/components/ControlPanel";
import { GoogleMap } from "@/components/GoogleMap";
import { ResultsPanel } from "@/components/ResultsPanel";
import { AIAnalysisPanel } from "@/components/AIAnalysisPanel";
import { useMeteorStore } from "@/lib/store/meteorStore";
import { Settings, Menu, Activity, Brain, Maximize2 } from "lucide-react";
import { useState } from "react";

export default function Home() {
  // Use Zustand store for global state management
  const { showResults, impactResults, toggleResultsPanel, isAnimating, isLocked, selectedDangerousPHAId } = useMeteorStore();
  const [showControls, setShowControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Prevent text selection and context menu */}
      <div className="select-none" onContextMenu={(e) => e.preventDefault()}>
      {/* Strategic Header */}
      <header className="strategic-header">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Activity className="w-6 h-6 text-orange-400" />
                  METEOR IMPACT
                </h1>
                <p className="text-muted-foreground text-sm">
                  Strategic Impact Analysis • Real-time Physics Calculations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Status Indicator */}
              {isAnimating && (
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/20 rounded-full">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-xs text-primary font-medium">CALCULATING</span>
                </div>
              )}

              {/* Settings Toggle - Top Right Corner */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white transition-all duration-200"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Strategic Interface */}
      <main className="relative h-[calc(100vh-80px)]">
        {/* Full-Screen Map */}
        <div className="absolute inset-0">
          <GoogleMap />
        </div>

        {/* Left Control Panel Overlay */}
        <div className={`absolute left-0 top-0 h-full w-96 z-20 ${showControls ? 'overlay-slide' : 'overlay-slide hidden'}`}>
          <div className="h-full p-4">
            <ControlPanel onClose={() => setShowControls(false)} />
          </div>
        </div>

        {/* Right Results Panel Overlay */}
        <div className={`absolute right-0 top-0 h-full w-96 z-20 ${showResults && impactResults ? 'overlay-slide-right' : 'overlay-slide-right hidden'}`}>
          <div className="h-full p-4">
            <ResultsPanel />
          </div>
        </div>

        {/* AI Analysis Panel Overlay - Bottom Right */}
        {selectedDangerousPHAId && !showAIModal && (
          <button
            onClick={() => setShowAIModal(true)}
            className="absolute right-4 bottom-4 z-30 control-button p-4 rounded-lg shadow-lg bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-200 group"
            title="Open AI Impact Analysis"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-white" />
              <Maximize2 className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
            </div>
            <span className="absolute -top-2 -right-2 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </button>
        )}

        {/* AI Analysis Modal - Centered */}
        {selectedDangerousPHAId && showAIModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setShowAIModal(false)}
            />

            {/* Modal Content */}
            <div
              className="relative z-50 w-full max-w-6xl max-h-[90vh] bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl animate-in zoom-in-95 fade-in duration-300 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <AIAnalysisPanel
                phaId={selectedDangerousPHAId}
                onClose={() => setShowAIModal(false)}
              />
            </div>
          </div>
        )}



        {/* Control Panel Toggle (when hidden) */}
        {!showControls && (
          <button
            onClick={() => setShowControls(true)}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 control-button p-3 rounded-lg shadow-lg"
            title="Show Control Panel"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Results Panel Toggle (when hidden but has results) */}
        {impactResults && !showResults && (
          <button
            onClick={toggleResultsPanel}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 control-button p-3 rounded-lg shadow-lg"
            title="Show Results Panel"
          >
            <Activity className="w-5 h-5" />
          </button>
        )}

        {/* AI Analysis Toggle (when PHA is selected) */}
        {/* Removed - now using floating button above */}

        {/* Mobile Overlay Backdrop */}
        {(showControls || (showResults && impactResults)) && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10 md:hidden"
            onClick={() => {
              setShowControls(false);
              if (showResults && impactResults) {
                // Don't close results on mobile, just the backdrop
              }
            }}
          />
        )}

        {/* Interface Lock Indicator - Shows during asteroid launch */}
        {isLocked && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-center border border-orange-500/30 flex items-center gap-2">
              <div className="animate-spin w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full"></div>
              <span className="text-sm text-orange-400 font-medium">🚀 Launching...</span>
            </div>
          </div>
        )}
      </main>

      {/* Strategic Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 glass-panel-enhanced mx-4 mb-2 p-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>© 2025 Meteor Impact</span>
            <span>•</span>
            <span>Strategic Analysis Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <span>NASA NEO Data</span>
            <span>•</span>
            <span>Real Physics Models</span>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
