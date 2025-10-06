"use client";

import { FileText, Share2, Download, Copy, Twitter, Facebook } from "lucide-react";
import { useMeteorStore } from "@/lib/store/meteorStore";
import { generateImpactReportPDF } from "@/lib/pdfGenerator";
import { formatDistance, formatEnergy, formatMegatons, formatNumber, formatTemperature, getImpactSeverity } from "@/lib/utils";
import { useState } from "react";

export function ShareButtons() {
  const { impactResults, parameters, impactLocation, impactSites } = useMeteorStore();
  const [showSocialMenu, setShowSocialMenu] = useState(false);

  if (!impactResults) return null;

  const severity = getImpactSeverity(impactResults.energy.megatonsTNT);

  // Generate report content
  const generateReport = () => {
    const timestamp = new Date().toLocaleString();
    const location = impactLocation.address || `${impactLocation.lat.toFixed(4)}, ${impactLocation.lng.toFixed(4)}`;

    const report = {
      metadata: {
        generatedAt: timestamp,
        type: "Meteor Impact Analysis Report",
        version: "1.0"
      },
      input: {
        parameters: {
          diameter: `${parameters.diameter}m`,
          velocity: `${parameters.velocity} km/s`,
          angle: `${parameters.angle}°`,
          density: `${parameters.density} kg/m³`,
          composition: parameters.composition
        },
        location: {
          coordinates: `${impactLocation.lat}, ${impactLocation.lng}`,
          address: impactLocation.address || "Custom location"
        }
      },
      results: {
        energy: {
          total: formatEnergy(impactResults.energy.joules),
          tntEquivalent: formatMegatons(impactResults.energy.megatonsTNT)
        },
        crater: {
          diameter: formatDistance(impactResults.crater.diameter),
          depth: formatDistance(impactResults.crater.depth)
        },
        effects: {
          fireballRadius: formatDistance(impactResults.effects.fireball.radius * 1000),
          maxTemperature: formatTemperature(impactResults.effects.fireball.temperature),
          airblastRadius: formatDistance(impactResults.effects.airblast.overpressureRadius * 1000),
          seismicMagnitude: impactResults.effects.seismic.magnitude.toFixed(1)
        },
        casualties: {
          estimated: formatNumber(impactResults.casualties.estimated),
          affectedPopulation: formatNumber(impactResults.casualties.affectedPopulation)
        }
      },
      assessment: {
        severity: severity.level.toUpperCase(),
        description: severity.description,
        recommendations: generateRecommendations(severity.level)
      }
    };

    return JSON.stringify(report, null, 2);
  };

  // Generate social media content
  const generateSocialContent = () => {
    const location = impactLocation.address || `Lat: ${impactLocation.lat.toFixed(2)}, Lng: ${impactLocation.lng.toFixed(2)}`;

    return {
      twitter: `🚨 Meteor Impact Analysis 🚨

💥 Energy: ${formatMegatons(impactResults.energy.megatonsTNT)}
🕳️ Crater: ${formatDistance(impactResults.crater.diameter)} diameter
📍 Location: ${location}
⚠️ Severity: ${severity.level.toUpperCase()}

Simulated via Meteor Impact tool #MeteorImpact #Space`,

      facebook: `Just simulated a meteor impact using this amazing tool!

📊 Impact Analysis Results:
• Energy Release: ${formatMegatons(impactResults.energy.megatonsTNT)}
• Crater Formation: ${formatDistance(impactResults.crater.diameter)} diameter crater
• Location: ${location}
• Severity Level: ${severity.level.toUpperCase()}

The destructive power is incredible - this simulation shows what would happen if a meteor of ${parameters.diameter}m diameter hit at ${parameters.velocity} km/s. Stay curious about space!`,

      clipboard: `Meteor Impact Simulation Results:

📍 Impact Location: ${location}
💥 Energy Release: ${formatMegatons(impactResults.energy.megatonsTNT)}
🕳️ Crater Size: ${formatDistance(impactResults.crater.diameter)} diameter × ${formatDistance(impactResults.crater.depth)} depth
🔥 Fireball Radius: ${formatDistance(impactResults.effects.fireball.radius * 1000)}
💨 Airblast Radius: ${formatDistance(impactResults.effects.airblast.overpressureRadius * 1000)}
⚡ Seismic Magnitude: ${impactResults.effects.seismic.magnitude.toFixed(1)}
👥 Estimated Casualties: ${formatNumber(impactResults.casualties.estimated)}

Severity: ${severity.level.toUpperCase()}`
    };
  };

  // Generate recommendations based on severity
  const generateRecommendations = (level: string) => {
    switch (level) {
      case 'minimal':
        return ['No significant threat to human populations', 'Local geological interest only'];
      case 'low':
        return ['Minimal risk to populated areas', 'Monitor for secondary effects'];
      case 'moderate':
        return ['Potential for local damage', 'Emergency services should prepare response plans'];
      case 'high':
        return ['Significant threat to life and property', 'Immediate evacuation may be necessary', 'Contact civil defense authorities'];
      case 'catastrophic':
        return ['Extreme threat to civilization', 'Global catastrophe potential', 'Maximum emergency response required'];
      default:
        return ['Assessment complete'];
    }
  };

  // Handle report download
  const downloadReport = () => {
    const timestamp = new Date().toLocaleString();
    const reportData = {
      parameters,
      impactLocation,
      impactResults,
      timestamp
    };

    generateImpactReportPDF(reportData);
  };

  // Handle social sharing
  const shareToTwitter = () => {
    const content = generateSocialContent();
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(content.twitter);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
  };

  const shareToFacebook = () => {
    const content = generateSocialContent();
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${encodeURIComponent(content.facebook)}`, '_blank', 'width=600,height=400');
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    const content = generateSocialContent();
    try {
      await navigator.clipboard.writeText(content.clipboard);
      // You could add a toast notification here
      console.log('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Report Button */}
      <div className="relative">
        <button
          onClick={downloadReport}
          className="p-3 rounded-lg shadow-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white transition-all duration-200"
          title="Download Impact Report"
        >
          <FileText className="w-5 h-5" />
        </button>
      </div>

      {/* Social Share Button */}
      <div className="relative">
        <button
          onClick={() => setShowSocialMenu(!showSocialMenu)}
          className="p-3 rounded-lg shadow-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 hover:text-white transition-all duration-200"
          title="Share to Social Media"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Social Media Dropdown */}
        {showSocialMenu && (
          <>
            <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => { shareToTwitter(); setShowSocialMenu(false); }}
                  className="w-full flex items-center gap-2 p-2 text-left text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <Twitter className="w-4 h-4" />
                  Share to Twitter
                </button>
                <button
                  onClick={() => { shareToFacebook(); setShowSocialMenu(false); }}
                  className="w-full flex items-center gap-2 p-2 text-left text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                  Share to Facebook
                </button>
                <button
                  onClick={() => { copyToClipboard(); setShowSocialMenu(false); }}
                  className="w-full flex items-center gap-2 p-2 text-left text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy to Clipboard
                </button>
              </div>
            </div>
            {/* Backdrop to close menu */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowSocialMenu(false)}
            />
          </>
        )}
      </div>
    </div>
  );
}
