// src/components/UnifiedWithdrawModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Minus, Bitcoin, Building2, AlertTriangle, Calculator } from 'lucide-react';

interface UnifiedWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioData: any;
  onSuccess: () => void;
}

export default function UnifiedWithdrawModal({ 
  isOpen, 
  onClose, 
  portfolioData, 
  onSuccess 
}: UnifiedWithdrawModalProps) {
  const [withdrawType, setWithdrawType] = useState<'crypto' | 'fiat'>('crypto');
  const [selectedCurrency, setSelectedCurrency] = useState('BTC');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const fees: {[key: string]: number} = { 
    BTC: 0.0005, 
    ETH: 0.005, 
    LTC: 0.001, 
    TRX: 1 
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (withdrawType === 'crypto') {
      const balance = portfolioData?.crypto.account.balances[selectedCurrency] || 0;
      if (parseFloat(amount) > balance) {
        newErrors.amount = 'Insufficient crypto balance';
      }
      if (!address) {
        newErrors.address = 'Please enter withdrawal address';
      }
    } else {
      const cashBalance = portfolioData?.stocks.portfolio.cashBalance || 0;
      if (parseFloat(amount) > cashBalance) {
        newErrors.amount = 'Insufficient cash balance';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleWithdraw = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (withdrawType === 'crypto') {
        const response = await fetch('/api/crypto/withdraw', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currency: selectedCurrency,
            amount: parseFloat(amount),
            toAddress: address
          })
        });

        const data = await response.json();
        if (data.success) {
          onSuccess();
          onClose();
          setAmount('');
          setAddress('');
        } else {
          setErrors({ general: data.error });
        }
      } else {
        // Handle fiat withdrawal
        alert('Fiat withdrawal functionality to be implemented');
      }
    } catch (error) {
      setErrors({ general: 'Withdrawal failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const fee = withdrawType === 'crypto' ? (fees[selectedCurrency] || 0) : 0;
  const receiveAmount = parseFloat(amount || '0') - fee;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Minus className="text-red-500" />
            Withdraw Funds
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded text-red-400 text-sm">
            {errors.general}
          </div>
        )}

        <div className="space-y-4">
          {/* Withdraw Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Select Withdrawal Type
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setWithdrawType('crypto')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-colors ${
                  withdrawType === 'crypto'
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Bitcoin size={16} />
                Crypto
              </button>
              {/* <button
                onClick={() => setWithdrawType('fiat')}
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg transition-colors ${
                  withdrawType === 'fiat'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Building2 size={16} />
                Cash/Fiat
              </button> */}
            </div>
          </div>

          {withdrawType === 'crypto' ? (
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
                  <option value="LTC">Litecoin (LTC)</option>
                  <option value="TRX">TRON (TRX)</option>
                </select>
              </div>

              {/* Available Balance */}
              <div className="bg-slate-700 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Available Balance:</span>
                  <span className="text-white font-medium">
                    {(portfolioData?.crypto.account.balances[selectedCurrency] || 0).toFixed(6)} {selectedCurrency}
                  </span>
                </div>
              </div>

              {/* Withdrawal Address */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Withdrawal Address *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={`Enter ${selectedCurrency} address`}
                  className={`w-full bg-slate-700 border rounded px-3 py-2 text-white font-mono text-sm ${
                    errors.address ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                {errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
              </div>
            </>
          ) : (
            <>
              {/* Cash Balance */}
              <div className="bg-slate-700 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Available Cash:</span>
                  <span className="text-white font-medium">
                    ${(portfolioData?.stocks.portfolio.cashBalance || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Withdrawal Method */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Withdrawal Method
                </label>
                <select className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white">
                  <option>Bank Transfer</option>
                  <option>PayPal</option>
                  <option>Check</option>
                </select>
              </div>
            </>
          )}

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Amount *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={withdrawType === 'crypto' ? `Enter ${selectedCurrency} amount` : 'Enter USD amount'}
              className={`w-full bg-slate-700 border rounded px-3 py-2 text-white ${
                errors.amount ? 'border-red-500' : 'border-slate-600'
              }`}
              step={withdrawType === 'crypto' ? '0.00000001' : '0.01'}
            />
            {errors.amount && <p className="text-red-400 text-sm mt-1">{errors.amount}</p>}
          </div>

          {/* Transaction Summary */}
          {amount && parseFloat(amount) > 0 && withdrawType === 'crypto' && (
            <div className="bg-slate-700 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Calculator size={16} className="text-slate-400" />
                <span className="font-medium">Transaction Summary</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">Withdrawal Amount:</span>
                  <span className="text-white">{amount} {selectedCurrency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Network Fee:</span>
                  <span className="text-white">{fee} {selectedCurrency}</span>
                </div>
                <div className="border-t border-slate-600 pt-2">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-300">You will receive:</span>
                    <span className={`${receiveAmount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {receiveAmount > 0 ? receiveAmount.toFixed(6) : '0'} {selectedCurrency}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="text-red-400 mt-0.5 flex-shrink-0" size={16} />
              <div>
                <h4 className="font-medium text-red-400 mb-1">Warning</h4>
                <p className="text-sm text-red-200">
                  Withdrawals are irreversible. Please double-check all details before confirming.
                  Status will show as "Pending" until processed.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleWithdraw}
            disabled={!amount || (withdrawType === 'crypto' && !address) || loading || (withdrawType === 'crypto' && receiveAmount <= 0)}
            className="w-full px-4 py-3 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? 'Processing Withdrawal...' : `Withdraw ${withdrawType === 'crypto' ? selectedCurrency : 'Funds'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
