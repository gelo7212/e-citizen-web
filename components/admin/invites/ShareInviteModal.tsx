'use client';

import React, { useState } from 'react';
import { InviteResponse } from '@/types';

interface ShareInviteModalProps {
  invite: InviteResponse | null;
  onClose: () => void;
}

export default function ShareInviteModal({
  invite,
  onClose,
}: ShareInviteModalProps) {
  const [copied, setCopied] = useState(false);

  if (!invite) return null;

  const inviteLink = invite.inviteLink || `${window.location.origin}/invites/${invite.inviteId}`;
  const shareText = `You're invited to join! Use code: ${invite.code}`;
  const fullShareText = `${shareText}\n\nClick here to accept: ${inviteLink}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(invite.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyFull = () => {
    navigator.clipboard.writeText(fullShareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-900">Share Invite</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Role and Expiration */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Role</p>
                <p className="text-sm font-bold text-gray-900">
                  {invite.role === 'CITY_ADMIN'
                    ? 'City Admin'
                    : invite.role === 'SOS_ADMIN'
                    ? 'SOS Admin'
                    : 'SK Admin'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">Municipality</p>
                <p className="text-sm font-bold text-gray-900">{invite.municipalityCode}</p>
              </div>
            </div>
          </div>

          {/* Invitation Code */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Invitation Code (6 digits)
            </label>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-100 rounded-lg p-3 font-mono text-center text-lg font-bold text-gray-900">
                {invite.code}
              </div>
              <button
                onClick={handleCopyCode}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Share this 6-digit code with the user to accept the invitation
            </p>
          </div>

          {/* Invitation Link */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Invitation Link
            </label>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-100 rounded-lg p-3 text-xs text-gray-600 overflow-x-auto">
                {inviteLink}
              </div>
              <button
                onClick={handleCopyLink}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition whitespace-nowrap"
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Direct link to the invitation acceptance page
            </p>
          </div>

          {/* Full Share Text */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Share Message
            </label>
            <textarea
              value={fullShareText}
              readOnly
              className="w-full bg-gray-100 rounded-lg p-3 text-sm text-gray-600 font-mono h-24 resize-none"
            />
            <button
              onClick={handleCopyFull}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition mt-2"
            >
              {copied ? '✓ Copied!' : 'Copy Full Message'}
            </button>
          </div>

          {/* Expiration Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-xs font-medium text-yellow-900">
              ⏱️ This invite expires at{' '}
              {new Date(invite.expiresAt).toLocaleString()}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}
