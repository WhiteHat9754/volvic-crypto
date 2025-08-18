// src/components/UnifiedDepositModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Plus, Bitcoin, Building2, AlertTriangle, Copy, CheckCircle } from 'lucide-react';

interface UnifiedDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioData: any;
  onSuccess: () => void;
}

export default function UnifiedDepositModal({ 
  isOpen, 
  onClose, 
  portfolioData, 
  onSuccess 
}: UnifiedDepositModalProps) {
  const [depositType, setDepositType] = useState<'crypto' | 'fiat'>('crypto');
  const [selectedCurrency, setSelectedCurrency] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = () => {
    const address = portfolioData?.crypto.account.depositAddresses[selectedCurrency];
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDeposit = async () => {
    if (!amount) return;

    setLoading(true);
    try {
      if (depositType === 'crypto') {
        const response = await fetch('/api/crypto/deposit', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currency: selectedCurrency,
            amount: parseFloat(amount)
          })
        });

        const data = await response.json();
        if (data.success) {
          onSuccess();
          onClose();
          setAmount('');
        }
      } else {
        // Handle fiat deposit (add to cash balance)
        alert('Fiat deposit functionality to be implemented');
      }
    } catch (error) {
      console.error('Deposit error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="text-green-500" />
            Deposit Funds
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Deposit Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Select Deposit Type
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setDepositType('crypto')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-colors ${
                  depositType === 'crypto'
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Bitcoin size={16} />
                Crypto
              </button>
              {/* <button
                onClick={() => setDepositType('fiat')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-colors ${
                  depositType === 'fiat'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Building2 size={16} />
                Cash/Fiat
              </button> */}
            </div>
          </div>

          {depositType === 'crypto' ? (
            <>
              {/* Currency Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select Cryptocurrency
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                >
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                </select>
              </div>

              {/* Deposit Address */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Deposit Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={portfolioData?.crypto.account.depositAddresses[selectedCurrency] || 'Loading...'}
                    readOnly
                    className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm font-mono"
                  />
                  <button
                    onClick={handleCopyAddress}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Amount (Optional)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Enter ${selectedCurrency} amount`}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  step="0.00000001"
                />
              </div>

              {/* Important Notes */}
              <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-lg">
                <h4 className="font-medium text-amber-400 mb-2 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  Important Notes
                </h4>
                <ul className="text-sm text-amber-200 space-y-1">
                  <li>• Only send {selectedCurrency} to this address</li>
                  <li>• Minimum deposit: {selectedCurrency === 'BTC' ? '0.001 BTC' : '0.01 ETH'}</li>
                  <li>• Deposits require 3 network confirmations</li>
                  <li>• Processing time: 15-30 minutes</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Fiat Deposit Options */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Deposit Method
                </label>
                <select className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                  <option>Bank Transfer</option>
                  <option>Credit/Debit Card</option>
                  <option>PayPal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter USD amount"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                  min="10"
                />
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                <p className="text-sm text-blue-200">
                  Fiat deposits will be added to your cash balance for stock trading.
                  Minimum deposit: $10. Processing time: 1-3 business days.
                </p>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeposit}
              disabled={!amount || loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Confirm Deposit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
