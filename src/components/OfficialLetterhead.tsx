import React from 'react';
import { Organization } from '../types';
import { getOrgBranding } from '../utils/branding';
import { Building2, Phone, Mail, Globe, MapPin, ShieldCheck } from 'lucide-react';

interface OfficialLetterheadProps {
  organization?: Organization | null;
  documentType: 'receipt' | 'report' | 'statement' | 'voucher';
  documentTitle: string;
  documentNumber?: string;
  documentDate?: string;
  subtitle?: string;
  className?: string;
}

export const OfficialLetterhead: React.FC<OfficialLetterheadProps> = ({
  organization,
  documentType,
  documentTitle,
  documentNumber,
  documentDate,
  subtitle,
  className = '',
}) => {
  const branding = getOrgBranding(organization);
  const primaryColor = branding.primaryColor || '#059669';

  const orgName = branding.letterheadHeader || organization?.name || 'DUES BOOK ENTERPRISE';
  const orgMotto = organization?.motto || 'Every naira has a history.';
  const orgSubheader = branding.letterheadSubheader;
  const address = branding.contactAddress;
  const phone = branding.contactPhone;
  const email = branding.contactEmail;
  const website = branding.website;
  const logoUrl = branding.logoUrl;

  return (
    <header
      className={`border-b-2 border-slate-900 pb-5 space-y-3 print:pb-4 ${className}`}
      id="official-letterhead-header"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left / Center: Logo & Organization Letterhead Details */}
        <div className="flex items-start space-x-4">
          {/* Logo or Fallback Badge */}
          {logoUrl ? (
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-white flex items-center justify-center p-1">
              <img
                src={logoUrl}
                alt={`${orgName} Logo`}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              {organization?.code ? organization.code.substring(0, 3) : <Building2 className="w-7 h-7" />}
            </div>
          )}

          {/* Letterhead Identity */}
          <div className="space-y-0.5">
            <div
              className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest flex items-center space-x-1.5"
              style={{ color: primaryColor }}
            >
              <span>{documentTitle}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-medium capitalize">
                {organization?.type || 'Association'}
              </span>
            </div>

            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-slate-950 uppercase leading-tight">
              {orgName}
            </h1>

            {orgMotto && (
              <p className="text-xs text-slate-500 italic">
                &ldquo;{orgMotto}&rdquo;
              </p>
            )}

            {orgSubheader && (
              <p className="text-[11px] font-medium text-slate-600">
                {orgSubheader}
              </p>
            )}
          </div>
        </div>

        {/* Right: Document Metadata & Ref Number */}
        <div className="text-left sm:text-right text-xs space-y-1 self-stretch sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
          {documentNumber && (
            <div className="font-mono text-sm font-bold text-slate-900 bg-slate-100 sm:bg-transparent px-2 sm:px-0 py-1 sm:py-0 rounded">
              {documentNumber}
            </div>
          )}
          {documentDate && (
            <div className="text-slate-600 font-medium text-xs">
              <span className="text-slate-400">Date: </span>
              <span className="font-semibold text-slate-800">{documentDate}</span>
            </div>
          )}
          {organization?.code && (
            <div className="text-[11px] text-slate-400">
              Org Code: <span className="font-mono font-semibold text-slate-600">{organization.code}</span>
            </div>
          )}
          {subtitle && (
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Official Secretariat Contact Line */}
      {(address || phone || email || website) && (
        <div className="pt-2 border-t border-dashed border-slate-200 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
          {address && (
            <div className="flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{address}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center space-x-1">
              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{phone}</span>
            </div>
          )}
          {email && (
            <div className="flex items-center space-x-1">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{email}</span>
            </div>
          )}
          {website && (
            <div className="flex items-center space-x-1">
              <Globe className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{website}</span>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

interface OfficialSignatoryProps {
  organization?: Organization | null;
  officerName?: string;
  officerRole?: string;
  dateSigned?: string;
  notes?: string;
  className?: string;
}

export const OfficialSignatory: React.FC<OfficialSignatoryProps> = ({
  organization,
  officerName,
  officerRole,
  dateSigned,
  notes,
  className = '',
}) => {
  const branding = getOrgBranding(organization);
  const primaryColor = branding.primaryColor || '#059669';

  const defaultSignatoryName = branding.signatoryName || officerName || 'Executive Financial Secretary';
  const defaultSignatoryTitle = branding.signatoryTitle || officerRole || 'Authorized Signatory';
  const signatureUrl = branding.signatureUrl;
  const footerNote = branding.letterheadFooter || notes || 'Official financial instrument. Every naira has a verified audit history.';

  return (
    <div className={`pt-5 mt-6 border-t border-slate-200 space-y-4 ${className}`} id="official-signatory-block">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
        {/* Terms & Legal Disclaimer */}
        <div className="text-[11px] text-slate-500 max-w-sm space-y-1">
          <div className="font-bold uppercase tracking-wider text-slate-700 text-[10px] flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Official Authoritative Record</span>
          </div>
          <p className="leading-relaxed italic">
            {footerNote}
          </p>
        </div>

        {/* Official Signatory Box */}
        <div className="text-center sm:text-right space-y-1 min-w-[200px] shrink-0">
          {signatureUrl ? (
            <div className="h-12 flex items-end justify-center sm:justify-end mb-1">
              <img
                src={signatureUrl}
                alt="Authorized Signature"
                className="max-h-12 max-w-[160px] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="h-10 border-b border-slate-400 border-dashed w-44 ml-auto mb-1 flex items-end justify-center">
              <span className="text-[10px] font-serif italic text-slate-400">Authorized Officer Seal</span>
            </div>
          )}

          <div className="font-bold text-slate-900 text-xs">{defaultSignatoryName}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: primaryColor }}>
            {defaultSignatoryTitle}
          </div>
          {dateSigned && <div className="text-[10px] text-slate-400">Signed: {dateSigned}</div>}
        </div>
      </div>
    </div>
  );
};
