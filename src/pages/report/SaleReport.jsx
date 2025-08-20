import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, DollarSign, Package, RefreshCw, Users, Eye, Search } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import DateRangePicker from '../../components/DateRangePicker';

const SaleReport = () => {
  const [timeRange, setTimeRange] = useState('7days');
  const [selectedSeller, setSelectedSeller] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('overview');
  const { collapsed } = useOutletContext(); // 'overview' or 'detail'

  // Sample sellers data
  const sellers = [
    { id: 'all', name: 'Tất cả Seller', totalRevenue: 45600000, totalItems: 1250, roi: 17.2 },
    { id: 'seller1', name: 'Nguyễn Văn Huy', totalRevenue: 12800000, totalItems: 380, roi: 16.8 },
    { id: 'seller2', name: 'Trần Thị Mai', totalRevenue: 15200000, totalItems: 420, roi: 18.3 },
    { id: 'seller3', name: 'Lê Hoàng Nam', totalRevenue: 9800000, totalItems: 290, roi: 15.5 },
    { id: 'seller4', name: 'Phạm Thị Lan', totalRevenue: 7800000, totalItems: 160, roi: 19.2 },
  ];

  // Sample data for individual seller
  const getSellerData = (sellerId, range) => {
    const baseData7Days = [
      {
        date: '14/08',
        fee: 120000,
        profit1: 850000,
        roi: 15.2,
        operationCost: 200000,
        refund: 50000,
        profit2: 800000,
        totalItems: 45,
        revenue: 1200000,
        baseCost: 350000,
        adsSpend: 150000,
      },
      {
        date: '15/08',
        fee: 135000,
        profit1: 920000,
        roi: 16.8,
        operationCost: 220000,
        refund: 30000,
        profit2: 890000,
        totalItems: 52,
        revenue: 1350000,
        baseCost: 380000,
        adsSpend: 165000,
      },
      {
        date: '16/08',
        fee: 98000,
        profit1: 680000,
        roi: 12.5,
        operationCost: 180000,
        refund: 75000,
        profit2: 605000,
        totalItems: 38,
        revenue: 980000,
        baseCost: 280000,
        adsSpend: 120000,
      },
      {
        date: '17/08',
        fee: 156000,
        profit1: 1100000,
        roi: 18.3,
        operationCost: 250000,
        refund: 40000,
        profit2: 1060000,
        totalItems: 67,
        revenue: 1560000,
        baseCost: 410000,
        adsSpend: 190000,
      },
      {
        date: '18/08',
        fee: 142000,
        profit1: 980000,
        roi: 17.1,
        operationCost: 230000,
        refund: 60000,
        profit2: 920000,
        totalItems: 58,
        revenue: 1420000,
        baseCost: 390000,
        adsSpend: 175000,
      },
      {
        date: '19/08',
        fee: 178000,
        profit1: 1250000,
        roi: 19.6,
        operationCost: 280000,
        refund: 35000,
        profit2: 1215000,
        totalItems: 72,
        revenue: 1780000,
        baseCost: 450000,
        adsSpend: 210000,
      },
      {
        date: '20/08',
        fee: 165000,
        profit1: 1150000,
        roi: 18.8,
        operationCost: 260000,
        refund: 45000,
        profit2: 1105000,
        totalItems: 65,
        revenue: 1650000,
        baseCost: 430000,
        adsSpend: 195000,
      },
    ];

    const baseData30Days = [
      {
        date: 'Tuần 1',
        fee: 3200000,
        profit1: 22000000,
        roi: 16.2,
        operationCost: 5500000,
        refund: 1200000,
        profit2: 20800000,
        totalItems: 1250,
        revenue: 32000000,
        baseCost: 9500000,
        adsSpend: 4200000,
      },
      {
        date: 'Tuần 2',
        fee: 3800000,
        profit1: 26500000,
        roi: 17.8,
        operationCost: 6200000,
        refund: 900000,
        profit2: 25600000,
        totalItems: 1480,
        revenue: 38000000,
        baseCost: 11000000,
        adsSpend: 4800000,
      },
      {
        date: 'Tuần 3',
        fee: 3500000,
        profit1: 24200000,
        roi: 16.9,
        operationCost: 5800000,
        refund: 1100000,
        profit2: 23100000,
        totalItems: 1350,
        revenue: 35000000,
        baseCost: 10200000,
        adsSpend: 4500000,
      },
      {
        date: 'Tuần 4',
        fee: 4100000,
        profit1: 28800000,
        roi: 18.5,
        operationCost: 6800000,
        refund: 800000,
        profit2: 28000000,
        totalItems: 1620,
        revenue: 41000000,
        baseCost: 12200000,
        adsSpend: 5300000,
      },
    ];

    if (sellerId === 'all') {
      // For "all sellers", multiply data by number of sellers
      const multiplier = sellers.length - 1;
      return range === '7days'
        ? baseData7Days.map((item) => ({
            ...item,
            revenue: item.revenue * multiplier,
            profit1: item.profit1 * multiplier,
            profit2: item.profit2 * multiplier,
            totalItems: item.totalItems * multiplier,
          }))
        : baseData30Days.map((item) => ({
            ...item,
            revenue: item.revenue * multiplier,
            profit1: item.profit1 * multiplier,
            profit2: item.profit2 * multiplier,
            totalItems: item.totalItems * multiplier,
          }));
    }

    // For individual sellers, modify data slightly based on seller ID
    const modifier = sellerId === 'seller1' ? 1 : sellerId === 'seller2' ? 1.2 : sellerId === 'seller3' ? 0.8 : 0.6;
    return range === '7days'
      ? baseData7Days.map((item) => ({
          ...item,
          revenue: Math.round(item.revenue * modifier),
          profit1: Math.round(item.profit1 * modifier),
          profit2: Math.round(item.profit2 * modifier),
          totalItems: Math.round(item.totalItems * modifier),
        }))
      : baseData30Days.map((item) => ({
          ...item,
          revenue: Math.round(item.revenue * modifier),
          profit1: Math.round(item.profit1 * modifier),
          profit2: Math.round(item.profit2 * modifier),
          totalItems: Math.round(item.totalItems * modifier),
        }));
  };

  const currentData = getSellerData(selectedSeller, timeRange);
  const filteredSellers = sellers.filter((seller) => seller.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  // Calculate totals
  const totals = currentData.reduce(
    (acc, item) => ({
      revenue: acc.revenue + item.revenue,
      profit1: acc.profit1 + item.profit1,
      profit2: acc.profit2 + item.profit2,
      totalItems: acc.totalItems + item.totalItems,
      adsSpend: acc.adsSpend + item.adsSpend,
      operationCost: acc.operationCost + item.operationCost,
    }),
    { revenue: 0, profit1: 0, profit2: 0, totalItems: 0, adsSpend: 0, operationCost: 0 }
  );

  const avgROI = currentData.reduce((acc, item) => acc + item.roi, 0) / currentData.length;

  return (
    <div>
      {/* Header */}
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Sale Report
          </h1>
          <div className="flex justify-center items-center">
            <DateRangePicker
              mode="range"
              showOutsideDays
              modifiersClassNames={{
                selected: 'my-selected',
                range_middle: 'my-range-middle',
              }}
              modifiersStyles={{
                range_middle: {
                  backgroundColor: '#f3f4f6', // màu xám nhạt
                  fontWeight: 'normal', // không in đậm
                },
              }}
              // updateFilter={updateFilter}
            />
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        {viewMode === 'overview' ? (
          /* Seller Overview Mode */
          <div>
            {/* Quick Stats for All Sellers */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-[#e2e8f0] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng Seller</p>
                    <p className="text-2xl font-bold text-blue-600">{sellers.length - 1}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-[#e2e8f0] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(sellers.filter((s) => s.id !== 'all').reduce((acc, s) => acc + s.totalRevenue, 0))}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-[#e2e8f0] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">ROI trung bình</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(sellers.filter((s) => s.id !== 'all').reduce((acc, s) => acc + s.roi, 0) / (sellers.length - 1)).toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-[#e2e8f0] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatNumber(sellers.filter((s) => s.id !== 'all').reduce((acc, s) => acc + s.totalItems, 0))}
                    </p>
                  </div>
                  <Package className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Search and Seller Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-[#e2e8f0] mt-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Danh sách Seller</h3>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm seller..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSellers.map((seller) => (
                  <div
                    key={seller.id}
                    onClick={() => {
                      setSelectedSeller(seller.id);
                      setViewMode('detail');
                    }}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                      selectedSeller === seller.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{seller.name}</h4>
                      <button className="text-blue-600 hover:text-blue-800">
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Doanh thu:</span>
                        <span className="font-medium text-green-600">{formatCurrency(seller.totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tổng SP:</span>
                        <span className="font-medium">{formatNumber(seller.totalItems)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">ROI:</span>
                        <span className="font-medium text-blue-600">{seller.roi}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Detail View Mode */
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 border border-[#e2e8f0] lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.revenue)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Lợi nhuận 1</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totals.profit1)}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">ROI trung bình</p>
                    <p className="text-2xl font-bold text-purple-600">{avgROI.toFixed(1)}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
                    <p className="text-2xl font-bold text-orange-600">{formatNumber(totals.totalItems)}</p>
                  </div>
                  <Package className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Detailed Data Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Chi tiết theo {timeRange === '7days' ? 'ngày' : 'tuần'}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời gian</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phí</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lợi nhuận 1</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROI (%)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi phí vận hành</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hoàn tiền</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng SP</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi phí quảng cáo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.date}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.fee)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{formatCurrency(row.profit1)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">{row.roi}%</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.operationCost)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600">{formatCurrency(row.refund)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatNumber(row.totalItems)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-orange-600">{formatCurrency(row.adsSpend)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleReport;
