import jsPDF from 'jspdf';
import { ImpactResults, MeteorParameters, ImpactLocation } from '@/types/asteroid';
import { getImpactSeverity, formatDistance, formatEnergy, formatMegatons, formatNumber, formatTemperature } from '@/lib/utils';

interface PDFReportData {
  parameters: MeteorParameters;
  impactLocation: ImpactLocation;
  impactResults: ImpactResults;
  timestamp: string;
}

export function generateImpactReportPDF(data: PDFReportData): void {
  const { parameters, impactLocation, impactResults, timestamp } = data;
  const severity = getImpactSeverity(impactResults.energy.megatonsTNT);

  // Create new PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  let currentY = margin;

  // Helper function to add new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (currentY + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
    }
  };

  // Helper function to add section header
  const addSectionHeader = (title: string, y: number) => {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55); // Dark gray
    pdf.text(title, margin, y);
    return y + 10;
  };

  // Helper function to add subsection header
  const addSubsectionHeader = (title: string, y: number) => {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(75, 85, 99); // Medium gray
    pdf.text(title, margin + 5, y);
    return y + 8;
  };

  // Helper function to add key-value pair
  const addKeyValue = (key: string, value: string, y: number, isBold: boolean = false) => {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
    pdf.setTextColor(55, 65, 81); // Darker gray for keys

    const keyWidth = 60;
    pdf.text(key + ':', margin + 10, y);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(31, 41, 55); // Dark gray for values
    pdf.text(value, margin + 10 + keyWidth, y);

    return y + 6;
  };

  // Title and Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(239, 68, 68); // Red color for title
  pdf.text('METEOR IMPACT', pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;

  pdf.setFontSize(16);
  pdf.setTextColor(31, 41, 55);
  pdf.text('Analysis Report', pageWidth / 2, currentY, { align: 'center' });
  currentY += 20;

  // Report metadata
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(107, 114, 128);
  pdf.text(`Generated: ${timestamp}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  // Input Parameters Section
  checkPageBreak(40);
  currentY = addSectionHeader('INPUT PARAMETERS', currentY);

  // Meteor parameters
  currentY = addSubsectionHeader('Meteor Specifications', currentY);
  currentY = addKeyValue('Diameter', `${parameters.diameter} meters`, currentY);
  currentY = addKeyValue('Velocity', `${parameters.velocity} km/s`, currentY);
  currentY = addKeyValue('Impact Angle', `${parameters.angle} degrees`, currentY);
  currentY = addKeyValue('Density', `${parameters.density} kg/m³`, currentY);
  currentY = addKeyValue('Composition', parameters.composition, currentY);

  currentY += 5;

  // Location
  currentY = addSubsectionHeader('Impact Location', currentY);
  const locationText = impactLocation.address || `${impactLocation.lat.toFixed(4)}, ${impactLocation.lng.toFixed(4)}`;
  currentY = addKeyValue('Coordinates', `${impactLocation.lat.toFixed(6)}, ${impactLocation.lng.toFixed(6)}`, currentY);
  currentY = addKeyValue('Location', locationText, currentY);

  currentY += 10;

  // Impact Results Section
  checkPageBreak(60);
  currentY = addSectionHeader('IMPACT ANALYSIS RESULTS', currentY);

  // Energy release
  currentY = addSubsectionHeader('Energy Release', currentY);
  currentY = addKeyValue('Total Energy', formatEnergy(impactResults.energy.joules), currentY, true);
  currentY = addKeyValue('TNT Equivalent', formatMegatons(impactResults.energy.megatonsTNT), currentY, true);

  currentY += 5;

  // Crater formation
  currentY = addSubsectionHeader('Crater Formation', currentY);
  currentY = addKeyValue('Diameter', formatDistance(impactResults.crater.diameter), currentY);
  currentY = addKeyValue('Depth', formatDistance(impactResults.crater.depth), currentY);

  currentY += 5;

  // Environmental effects
  currentY = addSubsectionHeader('Environmental Effects', currentY);
  currentY = addKeyValue('Fireball Radius', formatDistance(impactResults.effects.fireball.radius * 1000), currentY);
  currentY = addKeyValue('Max Temperature', formatTemperature(impactResults.effects.fireball.temperature), currentY);
  currentY = addKeyValue('Airblast Radius', formatDistance(impactResults.effects.airblast.overpressureRadius * 1000), currentY);
  currentY = addKeyValue('Seismic Magnitude', `${impactResults.effects.seismic.magnitude.toFixed(1)} Richter`, currentY);

  currentY += 5;

  // Human impact
  currentY = addSubsectionHeader('Human Impact', currentY);
  currentY = addKeyValue('Estimated Casualties', formatNumber(impactResults.casualties.estimated), currentY);
  currentY = addKeyValue('Affected Population', formatNumber(impactResults.casualties.affectedPopulation), currentY);

  currentY += 10;

  // Assessment Section
  checkPageBreak(50);
  currentY = addSectionHeader('RISK ASSESSMENT', currentY);

  // Severity level with color coding
  const severityColors = {
    minimal: [34, 197, 94],    // Green
    low: [59, 130, 246],       // Blue
    moderate: [245, 158, 11],  // Yellow
    high: [239, 68, 68],       // Red
    catastrophic: [139, 69, 19] // Brown
  };

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  const color = severityColors[severity.level as keyof typeof severityColors] || [107, 114, 128];
  pdf.setTextColor(color[0], color[1], color[2]);
  pdf.text(`Severity Level: ${severity.level.toUpperCase()}`, margin, currentY);
  currentY += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(75, 85, 99);

  // Split description into lines if too long
  const descriptionLines = pdf.splitTextToSize(severity.description, pageWidth - 2 * margin);
  pdf.text(descriptionLines, margin, currentY);
  currentY += descriptionLines.length * 5 + 5;

  // Recommendations
  currentY = addSubsectionHeader('Recommendations', currentY);
  const recommendations = getRecommendations(severity.level);
  recommendations.forEach((rec: string, index: number) => {
    pdf.setFontSize(9);
    pdf.setTextColor(55, 65, 81);
    pdf.text(`• ${rec}`, margin + 5, currentY + index * 5);
  });

  currentY += recommendations.length * 5 + 10;

  // Footer
  checkPageBreak(20);
  const footerY = pageHeight - 15;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(107, 114, 128);
  pdf.text('Generated by Meteor Impact Analysis Tool', pageWidth / 2, footerY, { align: 'center' });

  // Save the PDF
  const fileName = `meteor-impact-report-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}

// Helper function to get recommendations based on severity
function getRecommendations(level: string): string[] {
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
}
