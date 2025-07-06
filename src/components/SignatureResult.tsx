import React, { useState } from 'react';
import { Medication } from '../types/index';
import { frequencies, routes } from '../constants/medication-data';
import { calculateDaysSupply } from '../lib/calculations';
import { DoseInput } from '../lib/signature';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import FHIRStructureViewer from './FHIRStructureViewer';
import {
  Eye,
  EyeOff,
  Copy,
  Check,
  RotateCcw,
  Code2,
  Package,
  Pill,
  Info
} from 'lucide-react';

interface SignatureResultProps {
  selectedMedication: Medication | null;
  dosage: DoseInput;
  route: string;
  frequency: string;
  specialInstructions: string;
  signature: { humanReadable: string; fhirRepresentation: any } | null;
  onReset?: () => void;
}

const SignatureResult: React.FC<SignatureResultProps> = ({ 
  selectedMedication,
  dosage,
  route,
  frequency,
  specialInstructions,
  signature,
  onReset 
}) => {
  const [showFhir, setShowFhir] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyFhirSuccess, setCopyFhirSuccess] = useState(false);

  // Calculate days supply if possible
  const daysSupply = selectedMedication && 
                    selectedMedication.packageInfo &&
                    dosage.value > 0 && 
                    frequency
    ? calculateDaysSupply(selectedMedication, {
        value: dosage.value,
        unit: dosage.unit,
        frequencyKey: frequency
      })
    : null;

  const handleCopy = async () => {
    if (signature?.humanReadable) {
      try {
        await navigator.clipboard.writeText(signature.humanReadable);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const handleCopyFhir = async () => {
    if (signature?.fhirRepresentation) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(signature.fhirRepresentation, null, 2));
        setCopyFhirSuccess(true);
        setTimeout(() => setCopyFhirSuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy FHIR:', err);
      }
    }
  };

  if (!signature) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Pill className="h-16 w-16 mb-4 text-muted-foreground" />
        <p className="text-lg">Fill out the form to generate a medication signature.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-foreground">Generated Signature</h3>
        {onReset && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="border-border text-secondary-foreground hover:text-foreground hover:bg-accent"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            New Signature
          </Button>
        )}
      </div>

      {/* Main signature display */}
      <Card className="bg-card border-2 border-primary">
        <CardContent className="p-6">
          <div className="p-4 bg-secondary rounded-lg mb-4">
            <p className="text-xl font-medium text-foreground">
              {signature.humanReadable}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={copySuccess ? "default" : "outline"}
              size="sm"
              onClick={handleCopy}
              className={copySuccess 
                ? "bg-green-600 hover:bg-green-700 text-white" 
                : "border-border text-secondary-foreground hover:text-foreground hover:bg-accent"
              }
            >
              {copySuccess ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copySuccess ? 'Copied!' : 'Copy Signature'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="border-border text-secondary-foreground hover:text-foreground hover:bg-accent"
            >
              {showDetails ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFhir(!showFhir)}
              className="border-border text-secondary-foreground hover:text-foreground hover:bg-accent"
            >
              <Code2 className="h-4 w-4 mr-1" />
              FHIR
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prescription details */}
      {showDetails && selectedMedication && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Prescription Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Medication</span>
                <p className="text-foreground font-medium">{selectedMedication.name}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Dose Form</span>
                <p className="text-foreground font-medium">{selectedMedication.doseForm}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Strength</span>
                <p className="text-foreground font-medium">
                  {selectedMedication.ingredient[0]?.strengthRatio && 
                    `${selectedMedication.ingredient[0].strengthRatio.numerator.value}${selectedMedication.ingredient[0].strengthRatio.numerator.unit}/` +
                    `${selectedMedication.ingredient[0].strengthRatio.denominator.value}${selectedMedication.ingredient[0].strengthRatio.denominator.unit}`
                  }
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Dose</span>
                <p className="text-foreground font-medium">{dosage.value} {dosage.unit}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Route</span>
                <p className="text-foreground font-medium">{routes[route]?.humanReadable || route}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Frequency</span>
                <p className="text-foreground font-medium">{frequencies[frequency]?.humanReadable || frequency}</p>
              </div>
              {specialInstructions && (
                <div className="space-y-1 col-span-full">
                  <span className="text-sm text-muted-foreground">Special Instructions</span>
                  <p className="text-foreground font-medium">{specialInstructions}</p>
                </div>
              )}
              {daysSupply !== null && (
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Days Supply</span>
                  <p className="text-foreground font-medium">{daysSupply} days</p>
                </div>
              )}
              {selectedMedication.packageInfo && (
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Package</span>
                  <p className="text-foreground font-medium flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    {selectedMedication.packageInfo.quantity} {selectedMedication.packageInfo.unit}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* FHIR Representation */}
      {showFhir && (
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-foreground">FHIR Representation</CardTitle>
            <Button
              variant={copyFhirSuccess ? "default" : "outline"}
              size="sm"
              onClick={handleCopyFhir}
              className={copyFhirSuccess 
                ? "bg-green-600 hover:bg-green-700 text-white" 
                : "border-border text-secondary-foreground hover:text-foreground hover:bg-accent"
              }
            >
              {copyFhirSuccess ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
              {copyFhirSuccess ? 'Copied!' : 'Copy FHIR'}
            </Button>
          </CardHeader>
          <CardContent>
            <FHIRStructureViewer data={signature.fhirRepresentation} />
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>This FHIR-compliant structure can be integrated with healthcare systems that support HL7 FHIR standards.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SignatureResult;