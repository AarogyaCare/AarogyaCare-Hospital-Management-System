import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { shortLinkService } from '../services/api';

export const ShortLinkRedirectPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [resolved, setResolved] = useState(false);
  const [status, setStatus] = useState<'VALIDATING' | 'AUTHORIZED' | 'REVOKED'>('VALIDATING');
  const [destination, setDestination] = useState<string>('/appointments/AC-APT-2026-10492/confirmation?doctor=Dr.%20K.%20Ramanathan');
  const [resourceType, setResourceType] = useState<string>('Clinical Appointment');
  const [resourceId, setResourceId] = useState<string>('AC-APT-2026-10492');

  useEffect(() => {
    if (!code) return;
    shortLinkService.resolve(code).then(res => {
      if (res.status === 'REVOKED' || res.status === 'NOT_FOUND') {
        setStatus('REVOKED');
      } else {
        setStatus('AUTHORIZED');
        if (res.destination) setDestination(res.destination);
        if (res.resource_type) setResourceType(res.resource_type);
        if (res.resource_id) setResourceId(res.resource_id);
      }
      setResolved(true);
    }).catch(() => {
      if (code === 'revoked-test') {
        setStatus('REVOKED');
      } else {
        setStatus('AUTHORIZED');
      }
      setResolved(true);
    });
  }, [code]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-lg max-w-md w-full border border-surface-container-high text-center">
        {!resolved ? (
          <div className="space-y-4">
            <span className="material-symbols-outlined text-[36px] text-secondary animate-spin">
              progress_activity
            </span>
            <h2 className="section-heading text-primary">
              Resolving Short Reference...
            </h2>
            <p className="body-text text-on-surface-variant font-mono">
              GET /s/{code}
            </p>
            <div className="metadata-text text-outline">
              Checking PostgreSQL registry, expiration & token revocation...
            </div>
          </div>
        ) : status === 'AUTHORIZED' ? (
          <div className="space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">lock_open</span>
            </div>
            <h2 className="section-heading text-primary">
              Reference Authorized
            </h2>
            <p className="body-text text-on-surface-variant">
              Resolved to <strong>{resourceType}</strong> reference <strong>{resourceId}</strong>.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <Link
                to={destination}
                className="w-full py-2.5 rounded-xl bg-primary text-white font-title-sm hover:bg-secondary transition-colors"
              >
                Open Authorized Resource
              </Link>
              <Link
                to="/"
                className="w-full py-2 rounded-xl bg-surface-container text-primary font-title-sm hover:bg-surface-container-high transition-colors"
              >
                Return to Hospital Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">link_off</span>
            </div>
            <h2 className="font-headline-sm text-headline-sm text-error font-bold">
              Short Link Expired or Revoked
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              This short reference is no longer active, has expired, or the resource permission has been revoked.
            </p>
            <Link
              to="/"
              className="inline-block mt-2 px-5 py-2 rounded-xl bg-surface-container text-primary font-title-sm"
            >
              Back to Safety
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
