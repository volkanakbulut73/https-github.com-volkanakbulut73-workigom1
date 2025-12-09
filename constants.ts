import { Voucher, VoucherCompany } from './types';

export const INITIAL_VOUCHERS: Voucher[] = [
  {
    id: '1',
    company: VoucherCompany.SODEXO,
    amount: 2000,
    price: 1700,
    expiryDate: '2024-12-31',
    location: 'İstanbul, Kadıköy',
    sellerName: 'Ahmet Y.',
    description: 'Nakit ihtiyacından dolayı satılık. Parça parça harcanabilir.',
    createdAt: '2024-05-20'
  },
  {
    id: '2',
    company: VoucherCompany.MULTINET,
    amount: 5000,
    price: 4000,
    expiryDate: '2025-01-15',
    location: 'Ankara, Çankaya',
    sellerName: 'Ayşe K.',
    description: 'Geçen seneden kalan bakiye, %20 indirimli veriyorum.',
    createdAt: '2024-05-21'
  },
  {
    id: '3',
    company: VoucherCompany.TICKET,
    amount: 1000,
    price: 950,
    expiryDate: '2024-08-30',
    location: 'İzmir, Bornova',
    sellerName: 'Mehmet T.',
    description: 'Az miktar kaldı, öğrenciye uygun.',
    createdAt: '2024-05-22'
  }
];

export const COMPANY_COLORS: Record<VoucherCompany, string> = {
  [VoucherCompany.SODEXO]: 'bg-blue-600',
  [VoucherCompany.MULTINET]: 'bg-indigo-600',
  [VoucherCompany.TICKET]: 'bg-red-600',
  [VoucherCompany.SETCARD]: 'bg-orange-500',
  [VoucherCompany.METROPOL]: 'bg-purple-600',
  [VoucherCompany.OTHER]: 'bg-gray-500',
};