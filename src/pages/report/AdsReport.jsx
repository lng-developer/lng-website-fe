import { data, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';
import { defaultFrom, defaultTo } from '../../utils/fomatDate';
import DateRangePicker from '../../components/DateRangePicker';
import { dataColors } from '../../utils/dataColors';
import { LuBoxes } from 'react-icons/lu';
import { FaSackDollar, FaMoneyBillWave } from 'react-icons/fa6';
import { AiFillDollarCircle } from 'react-icons/ai';
import { FaCircleDollarToSlot } from 'react-icons/fa6';
import { FcCalendar } from 'react-icons/fc';
import { FcShop } from 'react-icons/fc';
import { getAds } from '../../apis/report';
import SelectSeller from '../../components/SelectSeller';
import { getAllSellers } from '../../apis/user';
import { toast } from 'sonner';
import { Empty } from 'antd';
import { HiMiniUserGroup } from 'react-icons/hi2';
import { GiShop } from 'react-icons/gi';

const $ = (n) => (n >= 0 ? `$${Number(n).toFixed(2)}` : `-$${Math.abs(Number(n)).toFixed(2)}`);

const AdsReport = () => {
  const { collapsed } = useOutletContext();
  const { user } = useAuth();
  const [expandedDay, setExpandedDay] = useState(null);
  const [dataSource, setDataSource] = useState([]);
  const [summary, setSummary] = useState({});
  const [sellers, setSellers] = useState([]);
  const [selectSeller, setSelectSeller] = useState();
  const [filters, setFilters] = useState({
    from: defaultFrom,
    to: defaultTo,
    seller: '',
  });

  const updateFilter = (newValues) => {
    setFilters((prev) => ({
      ...prev,
      ...newValues,
    }));
  };

  const getAllAds = async (filters) => {
    try {
      const response = await getAds(filters);
      if (response.status === 200) {
        setDataSource(response.data?.days);
        setSummary(response.data?.summary);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchAllSellers = async () => {
    try {
      const res = await getAllSellers();
      if (res.status === 200) {
        const result = res.data?.map((item) => {
          return {
            label: item?.full_name,
            value: item?._id,
          };
        });
        setSellers(result);
      } else {
        toast.error(res.data?.message || 'Fetch error');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unexpected error');
    }
  };

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchAllSellers();
    }
  }, []);

  useEffect(() => {
    getAllAds(filters);
  }, [filters]);

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Amazon Ads Report
          </h1>
          <div className="flex justify-center items-center gap-2">
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
              updateFilter={updateFilter}
            />
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="w-[60%] flex justify-between items-center">
          <div
            className="w-[32%] p-4 rounded-lg"
            style={{ boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#64748b]">Total Spending ({summary?.days} days)</div>
                <span className="text-xl font-bold" style={{ color: dataColors.success }}>
                  {$(summary?.totalSpending)}
                </span>
              </div>
              <FaMoneyBillWave size={25} color={dataColors.success} />
            </div>
          </div>

          <div
            className="w-[32%] p-4 rounded-lg"
            style={{ boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#64748b]">Total Sellers</div>
                <span className="text-xl font-bold" style={{ color: dataColors.process }}>
                  {summary?.totalSellers}
                </span>
              </div>
              <HiMiniUserGroup size={25} color={dataColors.process} />
            </div>
          </div>

          <div
            className="w-[32%] p-4 rounded-lg"
            style={{ boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#64748b]">Total Shops</div>
                <span className="text-xl font-bold" style={{ color: dataColors.pending }}>
                  {summary?.totalShops}
                </span>
              </div>
              <GiShop size={25} color={dataColors.pending} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-center" style={{ marginTop: 20 }}>
          {user?.role === 'Admin' && (
            <SelectSeller
              title="Report By Seller"
              ListData={sellers}
              value={selectSeller}
              onChange={(val) => {
                setSelectSeller(val);
                updateFilter({ seller: val });
              }}
            />
          )}
        </div>

        {/* Daily List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: 20 }}>
          {dataSource.length > 0 ? (
            dataSource.map((dayData) => {
              const isExpanded = expandedDay === dayData.day?.iso;

              return (
                <div
                  key={dayData.day?.iso}
                  style={{
                    borderRadius: '8px',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
                  }}
                >
                  {/* Day Header */}
                  <div
                    style={{
                      padding: '10px 20px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setExpandedDay(isExpanded ? null : dayData.day?.iso)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div
                          style={{
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                          }}
                        >
                          <FcCalendar size={35} />
                        </div>
                        <div>
                          <div className="font-medium">{dayData.day?.convert1}</div>
                          <div style={{ fontSize: '14px', color: dataColors.title, fontWeight: 500 }}>{dayData.day?.convert2}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '12px', marginBottom: '4px', color: dataColors.title, fontWeight: '600' }}>
                            Total spending
                          </span>
                          <div className="text-xl font-bold" style={{ color: dataColors.success }}>
                            {$(dayData?.total_spend)}
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                          }}
                        >
                          <div
                            style={{
                              background: 'rgba(255,255,255,0.2)',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '600',
                            }}
                          >
                            <span>{dayData.seller_count}</span> <span style={{ color: dataColors.title }}> sellers</span>
                          </div>
                          <div
                            style={{
                              background: 'rgba(255,255,255,0.2)',
                              padding: '8px 16px',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '600',
                            }}
                          >
                            <span>{dayData.shop_count}</span>
                            <span style={{ color: dataColors.title }}> shops</span>
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: '20px',
                            transition: 'transform 0.3s',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            marginRight: 10,
                          }}
                        >
                          ▼
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded - Sellers and Shops */}
                  {isExpanded && (
                    <div style={{ padding: '20px', paddingTop: '5px' }} class="grid grid-cols-2 gap-4">
                      {dayData.by_seller.map((sellerData) => (
                        <div
                          key={sellerData.seller._id}
                          style={{
                            marginBottom: '20px',
                            padding: '15px 20px',
                            borderRadius: '8px',
                            boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
                          }}
                        >
                          {/* Seller Info */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '10px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontWeight: 'bold',
                                }}
                              >
                                {sellerData.seller.full_name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-sm">{sellerData.seller.full_name}</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                                  ID: {sellerData.seller._id}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Daily ads spend</div>
                              <div className="text-xl font-bold" style={{ color: dataColors.success }}>
                                {$(sellerData?.spend)}
                              </div>
                            </div>
                          </div>

                          {/* Shops Grid */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                              gap: '12px',
                            }}
                          >
                            {sellerData.by_shop.map((shop) => (
                              <div
                                key={shop.shop_id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: '10px',
                                  borderRadius: '8px',
                                  boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
                                  transition: 'all 0.2s',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontSize: '20px' }}>
                                    <FcShop />
                                  </span>
                                  <span
                                    style={{
                                      color: dataColors.title,
                                      fontSize: '14px',
                                      fontWeight: '500',
                                    }}
                                  >
                                    {shop.shop?.name}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    color: dataColors.success,
                                    fontWeight: 'bold',
                                  }}
                                  className="font-medium"
                                >
                                  {$(shop?.spend)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ marginTop: 20 }}>
              <Empty />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdsReport;
