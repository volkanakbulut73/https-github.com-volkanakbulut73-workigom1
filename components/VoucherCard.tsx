import React, { useState } from 'react';
import { Voucher } from '../types';
import { COMPANY_COLORS } from '../constants';
import { MapPin, Calendar, CreditCard, Sparkles, ChevronRight } from 'lucide-react';
import { analyzeDealWithGemini } from '../services/geminiService';

interface VoucherCardProps {
  voucher: Voucher;
}

export const VoucherCard: React.FC<VoucherCardProps> = ({ voucher }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const discountPercentage = Math.round(((voucher.amount - voucher.price) / voucher.amount) * 100);
  
  const handleAnalyze = async () => {
    setLoading(true);
    const result = await analyzeDealWithGemini(voucher);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Card Header */}
      <div className={`${COMPANY_COLORS[voucher.company] || 'bg-gray-500'} px-4 py-3 flex justify-between items-center`}>
        <span className="text-white font-bold text-lg tracking-wide">{voucher.company}</span>
        <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm">
          %{discountPercentage} İndirim
        </span>
      </div>

      {/* Card Body */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Kart Bakiyesi</p>
            <p className="text-xl font-bold text-gray-900">{voucher.amount.toLocaleString('tr-TR')} ₺</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 mb-1">Satış Fiyatı</p>
            <p className="text-xl font-bold text-emerald-600">{voucher.price.toLocaleString('tr-TR')} ₺</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            <span className="truncate">{voucher.location}</span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span>SKT: {voucher.expiryDate}</span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
             <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
             <span>Satıcı: {voucher.sellerName}</span>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mb-4 line-clamp-2 italic border-l-2 border-gray-200 pl-2">
            "{voucher.description}"
        </p>

        {/* AI Analysis Section */}
        {analysis && (
            <div className="mb-4 p-3 bg-indigo-50 rounded-lg text-sm text-indigo-900 border border-indigo-100 animate-fadeIn">
                <div className="flex items-center gap-1 font-semibold mb-1 text-indigo-700">
                    <Sparkles size={14} /> Gemini Analizi:
                </div>
                {analysis}
            </div>
        )}

        <div className="flex gap-2 mt-auto">
          <button 
            onClick={handleAnalyze}
            disabled={loading}
            className={`flex-1 flex items-center justify-center px-3 py-2 border border-indigo-200 text-indigo-600 text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Analiz Ediliyor...' : (
                <>
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Fırsatı Analiz Et
                </>
            )}
          </button>
          
          <button className="flex-1 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors px-3 py-2 flex items-center justify-center">
            Talip Ol <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};