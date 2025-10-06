"use client";

import { ControlPanel } from "@/components/ControlPanel";
import { GoogleMap } from "@/components/GoogleMap";
import { ResultsPanel } from "@/components/ResultsPanel";
import { ShareButtons } from "@/components/ShareButtons";
import { useMeteorStore } from "@/lib/store/meteorStore";
import { Menu, Activity } from "lucide-react";
import { useState } from "react";

export default function Home() {
  // Use Zustand store for global state management
  const { showResults, impactResults, toggleResultsPanel, isAnimating } = useMeteorStore();
  const [showControls, setShowControls] = useState(false);

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

              {/* Share Buttons - Top Right Corner */}
              <ShareButtons />
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
