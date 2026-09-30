import React from 'react';
import { UnderwritingRecord } from '@/lib/underwriting/underwritingStore';

interface CertificateTemplateProps {
  record: UnderwritingRecord;
}

export const CertificateTemplate = React.forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ record }, ref) => {
    // Current date logic
    const issueDate = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const startDate = new Date(record.submittedAt).toLocaleDateString('en-IN');
    const endDate = new Date(new Date(record.submittedAt).setFullYear(new Date(record.submittedAt).getFullYear() + 1)).toLocaleDateString('en-IN');

    return (
      <div 
        ref={ref}
        style={{
          width: '800px',
          padding: '40px',
          backgroundColor: '#ffffff',
          color: '#334155', // slate-700
          fontFamily: 'system-ui, -apple-system, sans-serif',
          lineHeight: '1.5'
        }}
        className="bg-white"
      >
        {/* Header */}
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '32px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#059669', fontWeight: 700 }}>AgriSurge</h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Agricultural Risk Intelligence
          </p>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Agricultural Insurance
          </p>
          <h2 style={{ margin: '8px 0', fontSize: '32px', fontWeight: 700, color: '#0f172a' }}>
            Policy Certificate
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>
            Official policy certificate generated after successful underwriting approval.
          </p>
        </div>

        {/* Policy Info Boxes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Policy Number</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.id}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Status</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600, color: '#059669' }}>APPROVED</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Policy Year</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{new Date().getFullYear()}</p>
          </div>
        </div>

        {/* Policyholder & Farm */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Policyholder & Farm</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Farmer Name</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.farmerName || 'Not provided'}</p>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Farm Name</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.farmName || 'Not provided'}</p>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Farm ID</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.farmCode || 'Not provided'}</p>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Application ID</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.id || 'Not provided'}</p>
            </div>
            <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Location</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.village ? `${record.village}, ` : ''}{record.taluka ? `${record.taluka}, ` : ''}{record.district || record.region || 'Not provided'}</p>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Farm Area</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.areaAcres ? `${record.areaAcres.toFixed(2)} Acres` : 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Insured Farm Boundary */}
        <div style={{ marginBottom: '32px', pageBreakInside: 'avoid' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Insured Farm Boundary</h3>
          <div style={{ 
            height: '400px', 
            backgroundColor: '#f1f5f9', 
            border: '1px solid #cbd5e1', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {record.boundaryImageBase64 ? (
              <img src={record.boundaryImageBase64} alt="Farm Boundary" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : null}
          </div>
          <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
            The selected farm polygon from the farm-registration step is inserted here automatically.
          </p>
        </div>

        {/* Crop & Coverage */}
        <div style={{ marginBottom: '32px', pageBreakInside: 'avoid' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Crop & Coverage</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Crop</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.crop || 'Not provided'}</p>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Crop Variety</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.cropVariety || 'Not provided'}</p>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Season</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.growthStage || 'Not provided'}</p>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Irrigation Type</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.irrigationType || 'Not provided'}</p>
            </div>
            <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Soil Type</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.soilType || 'Not provided'}</p>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Coverage Area</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.areaAcres ? `${record.areaAcres.toFixed(2)} Acres` : 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Premium and Risk Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '32px', pageBreakInside: 'avoid' }}>
          <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Sum Insured</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>₹{record.coverageAmount?.toLocaleString('en-IN') || '0'}</p>
          </div>
          <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Policy Premium</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>₹{record.recommendedPremium?.toLocaleString('en-IN') || '0'}</p>
          </div>
          <div style={{ padding: '12px 16px' }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Risk Category</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase' }}>{record.riskLevel || 'LOW'}</p>
          </div>
        </div>

        {/* Policy Validity & Terms */}
        <div style={{ marginBottom: '32px', pageBreakInside: 'avoid' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Policy Validity & Terms</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Policy Start Date</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{startDate}</p>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Policy End Date</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{endDate}</p>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Coverage Period</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>1 Year</p>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Issue Date</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{issueDate}</p>
            </div>
            <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Policy Status</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600, color: '#059669' }}>APPROVED</p>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Renewal</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>Manual</p>
            </div>
          </div>
        </div>

        {/* Location & Verification */}
        <div style={{ marginBottom: '32px', pageBreakInside: 'avoid' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Location & Verification Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Village</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.village || 'Not provided'}</p>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Taluka</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.taluka || 'Not provided'}</p>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>District</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.district || 'Not provided'}</p>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>State</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.region || 'Not provided'}</p>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Latitude</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.latitude?.toFixed(5) || 'Not provided'}</p>
            </div>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Longitude</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600 }}>{record.longitude?.toFixed(5) || 'Not provided'}</p>
            </div>
            <div style={{ padding: '12px 16px', borderRight: '1px solid #e2e8f0' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Boundary Reference</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600, fontFamily: 'monospace' }}>GEO-{record.id}</p>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Verification ID</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600, fontFamily: 'monospace' }}>VER-{Date.now().toString().slice(-6)}</p>
            </div>
          </div>
        </div>

        {/* Footer Signatures */}
        <div style={{ marginTop: '64px', display: 'flex', justifyContent: 'space-between', pageBreakInside: 'avoid' }}>
          <div>
            <div style={{ borderTop: '1px solid #94a3b8', width: '200px', paddingTop: '8px' }}>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>Authorized Underwriting Officer</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>{record.reviewedBy || 'System Automated'}</p>
            </div>
          </div>
          <div>
            <div style={{ borderTop: '1px solid #94a3b8', width: '200px', paddingTop: '8px', textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: 600 }}>AgriSurge</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Agricultural Risk Intelligence</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CertificateTemplate.displayName = 'CertificateTemplate';
