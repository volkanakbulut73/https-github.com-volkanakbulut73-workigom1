import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Voucher, VoucherCompany } from '../types';
import { Save, X } from 'lucide-react';

interface AddVoucherFormProps {
  onAdd: (voucher: Voucher) => void;
}

export const AddVoucherForm: React.FC<AddVoucherFormProps> = ({ onAdd }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<Voucher>>({
    company: VoucherCompany.SODEXO,
    amount: 0,
    price: 0,
    location: '',
    expiryDate: '',
    description: '',
    sellerName: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.price || !formData.company) return;

    const newVoucher: Voucher = {
      id: Date.now().toString(),
      company: formData.company as VoucherCompany,
      amount: Number(formData.amount),
      price: Number(formData.price),
      expiryDate: formData.expiryDate || 'Belirtilmedi',
      location: formData.location || 'İstanbul',
      sellerName: formData.sellerName || 'Anonim',
      description: formData.description || '',
      createdAt: new Date().toISOString()
    };

    onAdd(newVoucher);
    navigate('/');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Yeni İlan Ekle</h2>
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Firma</label>
                <select
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
                >
                {Object.values(VoucherCompany).map(company => (
                    <option key={company} value={company}>{company}</option>
                ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Son Kullanma Tarihi</label>
                <input
                type="date"
                name="expiryDate"
                required
                onChange={handleChange}
                className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kart Bakiyesi (TL)</label>
                <div className="relative">
                    <input
                    type="number"
                    name="amount"
                    placeholder="2000"
                    required
                    onChange={handleChange}
                    className="w-full rounded-lg border-gray-300 border p-2.5 pl-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İstediğiniz Fiyat (TL)</label>
                 <div className="relative">
                    <input
                    type="number"
                    name="price"
                    placeholder="1800"
                    required
                    onChange={handleChange}
                    className="w-full rounded-lg border-gray-300 border p-2.5 pl-4 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                </div>
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konum / İlçe</label>
            <input
            type="text"
            name="location"
            placeholder="Örn: İstanbul, Beşiktaş"
            required
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Satıcı Adı</label>
            <input
            type="text"
            name="sellerName"
            placeholder="Adınız Soyadınız"
            required
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <textarea
            name="description"
            rows={3}
            placeholder="Kartın kullanım detayları, teslimat şekli vb."
            onChange={handleChange}
            className="w-full rounded-lg border-gray-300 border p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
        </div>

        <div className="flex justify-end pt-4">
            <button
            type="submit"
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
            >
            <Save className="mr-2 -ml-1 h-5 w-5" />
            İlanı Yayınla
            </button>
        </div>
      </form>
    </div>
  );
};