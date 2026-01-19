import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { defaultFrom, defaultTo } from '../../utils/fomatDate';
import DateRangePicker from '../../components/DateRangePicker';
import { dataColors } from '../../utils/dataColors';
import { FcCalendar } from 'react-icons/fc';
import { exportAds, getAds } from '../../apis/report';
import SelectSeller from '../../components/SelectSeller';
import { getAllSellers } from '../../apis/user';
import { toast } from 'sonner';
import { Empty, Popover, Tooltip } from 'antd';
import { HiMiniUserGroup } from 'react-icons/hi2';
import { FcCurrencyExchange } from 'react-icons/fc';
import { MdOutlineRefresh } from 'react-icons/md';
import { FcShop } from 'react-icons/fc';
import { BiSolidFileExport } from 'react-icons/bi';

const $ = (n) => (n >= 0 ? `$${Number(n).toFixed(2)}` : `-$${Math.abs(Number(n)).toFixed(2)}`);

const AdsReport = () => {
  const { collapsed } = useOutletContext();
  const { user } = useAuth();
  const [expandedDay, setExpandedDay] = useState(null);
  const [viewMode, setViewMode] = useState('daily'); // daily | accounts
  const [expandedShop, setExpandedShop] = useState(null);
  const [expandedShopDay, setExpandedShopDay] = useState(null); // `${shopId}__${dayIso}`
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

  const content = (data = []) => {
    return data.map((item, index) => {
      return (
        <div key={index} className="flex">
          <div className="font-medium">{item?.shop?.name}:</div>
          <div className="ml-2 font-medium" style={{ color: dataColors.success }}>
            ${item?.spend}
          </div>
        </div>
      );
    });
  };

  const handleExport = async () => {
    try {
      const res = await exportAds({
        from: filters.from,
        to: filters.to,
      });

      // ✅ lấy filename từ header nếu backend có set Content-Disposition
      const disposition = res.headers?.['content-disposition'] || '';
      const match = disposition.match(/filename="(.+?)"/);
      const filename = match?.[1] || 'report_ads.xlsx';

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchAllSellers();
    }
  }, [user?.role]);

  useEffect(() => {
    getAllAds(filters);
  }, [filters]);

  useEffect(() => {
    // reset expand states when switching view
    setExpandedDay(null);
    setExpandedShop(null);
    setExpandedShopDay(null);
  }, [viewMode]);

  // Build Accounts (Shop) Aggregates: total days in range, detail each day, seller detail per day.
  const accountsData = useMemo(() => {
    const shopMap = new Map();

    (dataSource || []).forEach((dayData) => {
      const dayIso = dayData?.day?.iso;

      (dayData?.by_seller || []).forEach((sellerData) => {
        const sellerId = sellerData?.seller?._id;
        const sellerName = sellerData?.seller?.full_name || 'Unknown Seller';

        (sellerData?.by_shop || []).forEach((shopItem) => {
          const shopId = shopItem?.shop_id || shopItem?.shop?._id;
          const shopName = shopItem?.shop?.name || 'Unknown';
          const spend = Number(shopItem?.spend || 0);
          if (!shopId) return;

          if (!shopMap.has(shopId)) {
            shopMap.set(shopId, {
              shop_id: shopId,
              shop_name: shopName,
              total_spend: 0,
              sellersSet: new Set(), // unique sellers in range
              daysMap: new Map(), // dayIso -> { day, total_spend, sellersMap }
            });
          }

          const shopAgg = shopMap.get(shopId);
          shopAgg.total_spend += spend;
          if (sellerId) shopAgg.sellersSet.add(sellerId);

          const dayAgg = shopAgg.daysMap.get(dayIso) || {
            day: dayData?.day,
            total_spend: 0,
            sellersMap: new Map(), // sellerId -> { seller_id, seller_name, spend }
          };
          dayAgg.total_spend += spend;

          const sellerAgg = dayAgg.sellersMap.get(sellerId) || {
            seller_id: sellerId,
            seller_name: sellerName,
            spend: 0,
          };
          sellerAgg.spend += spend;
          dayAgg.sellersMap.set(sellerId, sellerAgg);

          shopAgg.daysMap.set(dayIso, dayAgg);
        });
      });
    });

    const rangeDays = Number(summary?.days || dataSource?.length || 0);

    return Array.from(shopMap.values())
      .map((shop) => {
        const daysArr = Array.from(shop.daysMap.values())
          .map((d) => {
            const sellersArr = Array.from(d.sellersMap.values()).sort((a, b) => b.spend - a.spend);
            return {
              day: d.day,
              total_spend: d.total_spend,
              seller_count: sellersArr.length,
              sellers: sellersArr,
            };
          })
          .sort((a, b) => new Date(b?.day?.iso || 0).getTime() - new Date(a?.day?.iso || 0).getTime());

        const activeDays = daysArr.filter((d) => Number(d.total_spend) > 0).length;

        return {
          shop_id: shop.shop_id,
          shop_name: shop.shop_name,
          total_spend: shop.total_spend,
          range_days: rangeDays,
          active_days: activeDays,
          total_sellers: shop.sellersSet.size,
          days: daysArr,
        };
      })
      .sort((a, b) => b.total_spend - a.total_spend);
  }, [dataSource, summary?.days]);

  const renderDailyList = () => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          marginTop: 20,
        }}
      >
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
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                      }}
                    >
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
                        <div
                          style={{
                            fontSize: '14px',
                            color: dataColors.title,
                            fontWeight: 500,
                          }}
                        >
                          {dayData.day?.convert2}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                      }}
                    >
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            marginBottom: '4px',
                            color: dataColors.title,
                            fontWeight: '600',
                          }}
                        >
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
                  <div style={{ padding: '20px', paddingTop: '5px' }} className="grid grid-cols-2 gap-5">
                    {dayData.by_seller.map((sellerData) => (
                      <div
                        key={sellerData.seller._id}
                        style={{
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
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                            }}
                          >
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
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: '#94a3b8',
                                  fontFamily: 'monospace',
                                }}
                              >
                                ID: {sellerData.seller._id}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                fontSize: '12px',
                                color: '#94a3b8',
                                marginBottom: '4px',
                              }}
                            >
                              Daily ads spend
                            </div>
                            <Popover trigger={'click'} placement="rightTop" content={content(sellerData.by_shop)}>
                              <div className="text-xl font-bold cursor-pointer hover:underline" style={{ color: dataColors.success }}>
                                {$(sellerData?.spend)}
                              </div>
                            </Popover>
                          </div>
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
    );
  };

  const renderAccountsView = () => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginTop: 20,
        }}
      >
        {accountsData?.length ? (
          accountsData.map((acc) => {
            const isExpanded = expandedShop === acc.shop_id;

            return (
              <div
                key={acc.shop_id}
                style={{
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
                }}
              >
                {/* Account Header */}
                <div
                  style={{
                    padding: '12px 20px',
                    cursor: 'pointer',
                  }}
                  onClick={() => setExpandedShop(isExpanded ? null : acc.shop_id)}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                      }}
                    >
                      <div
                        style={{
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FcShop size={35} />
                      </div>
                      <div>
                        <div className="font-medium">{acc.shop_name}</div>
                        <div
                          style={{
                            fontSize: '14px',
                            color: dataColors.title,
                            fontWeight: 500,
                          }}
                        >
                          Range: {acc.range_days} day(s) • Active: {acc.active_days} day(s) • Sellers: {acc.total_sellers}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                      }}
                    >
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            marginBottom: '4px',
                            color: dataColors.title,
                            fontWeight: '600',
                          }}
                        >
                          Total spend
                        </span>
                        <div className="text-xl font-bold" style={{ color: dataColors.success }}>
                          {$(acc.total_spend)}
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

                {/* Expanded - Days (and sellers per day) */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '20px',
                      paddingTop: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {acc.days?.length ? (
                      acc.days.map((d) => {
                        const dayIso = d?.day?.iso;
                        const dayKey = `${acc.shop_id}__${dayIso}`;
                        const isDayExpanded = expandedShopDay === dayKey;

                        return (
                          <div
                            key={dayKey}
                            style={{
                              borderRadius: '8px',
                              overflow: 'hidden',
                              boxShadow: 'rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
                            }}
                          >
                            <div
                              style={{
                                padding: '10px 16px',
                                cursor: 'pointer',
                              }}
                              onClick={() => setExpandedShopDay(isDayExpanded ? null : dayKey)}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                  }}
                                >
                                  <FcCalendar size={26} />
                                  <div>
                                    <div className="font-medium">{d?.day?.convert1}</div>
                                    <div
                                      style={{
                                        fontSize: '13px',
                                        color: dataColors.title,
                                        fontWeight: 500,
                                      }}
                                    >
                                      {d?.day?.convert2}
                                    </div>
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '18px',
                                  }}
                                >
                                  <div style={{ textAlign: 'right' }}>
                                    <div
                                      style={{
                                        fontSize: '12px',
                                        color: dataColors.title,
                                        fontWeight: '600',
                                      }}
                                    >
                                      Spend
                                    </div>
                                    <div className="font-bold" style={{ color: dataColors.success }}>
                                      {$(d.total_spend)}
                                    </div>
                                  </div>

                                  <div
                                    style={{
                                      background: 'rgba(255,255,255,0.2)',
                                      padding: '6px 12px',
                                      borderRadius: '8px',
                                      fontSize: '13px',
                                      fontWeight: '600',
                                    }}
                                  >
                                    <span>{d.seller_count}</span> <span style={{ color: dataColors.title }}> sellers</span>
                                  </div>

                                  <div
                                    style={{
                                      fontSize: '18px',
                                      transition: 'transform 0.3s',
                                      transform: isDayExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    }}
                                  >
                                    ▼
                                  </div>
                                </div>
                              </div>
                            </div>

                            {isDayExpanded && (
                              <div style={{ padding: '16px', paddingTop: '6px' }} className="grid grid-cols-2 gap-5">
                                {(d.sellers || []).length ? (
                                  d.sellers.map((s) => (
                                    <div
                                      key={`${dayKey}__${s.seller_id}`}
                                      style={{
                                        padding: '12px 16px',
                                        borderRadius: '8px',
                                        boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
                                      }}
                                    >
                                      <div
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                        }}
                                      >
                                        <div
                                          style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                          }}
                                        >
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
                                            {(s.seller_name || '?').charAt(0)}
                                          </div>
                                          <div>
                                            <div className="font-medium text-sm">{s.seller_name}</div>
                                            <div
                                              style={{
                                                fontSize: '12px',
                                                color: '#94a3b8',
                                                fontFamily: 'monospace',
                                              }}
                                            >
                                              ID: {s.seller_id}
                                            </div>
                                          </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                          <div
                                            style={{
                                              fontSize: '12px',
                                              color: '#94a3b8',
                                              marginBottom: '4px',
                                            }}
                                          >
                                            Spend
                                          </div>
                                          <div
                                            className="text-xl font-bold"
                                            style={{
                                              color: dataColors.success,
                                            }}
                                          >
                                            {$(s.spend)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div style={{ gridColumn: '1 / -1' }}>
                                    <Empty />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <Empty />
                    )}
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
    );
  };

  return (
    <div>
      <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
        <div className="h-[60px] gap-4 bg-background p-4 md:px-8 shadow-sm sticky top-0 flex items-center justify-between">
          <h1 className="text-2xl !mb-0" style={{ color: 'black' }}>
            Amazon Ads Report
          </h1>
          <div className="flex justify-center items-center gap-2">
            <button
              className="inline-flex gap-2 items-center justify-center rounded-md text-sm font-medium border border-input bg-[#f1f5f9] h-10 space-x-1 px-4 border-[#e2e8f0] cursor-pointer"
              onClick={handleExport}
            >
              <span className="text-sm font-medium" style={{ color: 'black' }}>
                Export Ads
              </span>
              <div style={{ color: 'black' }}>
                <BiSolidFileExport size={15} />
              </div>
            </button>
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
            style={{
              boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#64748b]">Total Spending ({summary?.days} days)</div>
                <span className="text-xl font-bold" style={{ color: dataColors.success }}>
                  {$(summary?.totalSpending || 0)}
                </span>
              </div>
              <FcCurrencyExchange size={30} color={dataColors.success} />
            </div>
          </div>

          <div
            className="w-[32%] p-4 rounded-lg"
            style={{
              boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#64748b]">Total Sellers</div>
                <span className="text-xl font-bold" style={{ color: dataColors.process }}>
                  {summary?.totalSellers || 0}
                </span>
              </div>
              <HiMiniUserGroup size={30} color={dataColors.process} />
            </div>
          </div>

          <div
            className="w-[32%] p-4 rounded-lg"
            style={{
              boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#64748b]">Total Shops</div>
                <span className="text-xl font-bold" style={{ color: dataColors.pending }}>
                  {summary?.totalShops || 0}
                </span>
              </div>
              <FcShop size={30} color={dataColors.pending} />
            </div>
          </div>
        </div>
        {user?.role === 'Admin' && (
          <div className="flex gap-2 items-center" style={{ marginTop: 20 }}>
            <SelectSeller
              title="Report By Seller"
              ListData={sellers}
              value={selectSeller}
              onChange={(val) => {
                setSelectSeller(val);
                updateFilter({ seller: val });
              }}
            />

            <Tooltip title="Refresh">
              <button
                className="py-2 px-3 rounded hover:bg-[#f1f5f9] cursor-pointer"
                onClick={() => {
                  getAllAds(filters);
                  toast.success('Refresh success!');
                }}
              >
                <MdOutlineRefresh size={20} />
              </button>
            </Tooltip>
          </div>
        )}
        {/* View Tabs (keep existing layout, only add a small switcher) */}
        <div className="flex gap-2 items-center" style={{ marginTop: 16 }}>
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input h-9 px-4 border-[#e2e8f0] cursor-pointer"
            style={{
              background: viewMode === 'daily' ? '#ffffff' : '#f1f5f9',
              boxShadow: viewMode === 'daily' ? 'rgba(9, 30, 66, 0.08) 0px 0px 0px 1px' : 'none',
              color: 'black',
            }}
            onClick={() => setViewMode('daily')}
          >
            Daily List
          </button>
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input h-9 px-4 border-[#e2e8f0] cursor-pointer"
            style={{
              background: viewMode === 'accounts' ? '#ffffff' : '#f1f5f9',
              boxShadow: viewMode === 'accounts' ? 'rgba(9, 30, 66, 0.08) 0px 0px 0px 1px' : 'none',
              color: 'black',
            }}
            onClick={() => setViewMode('accounts')}
          >
            Accounts View
          </button>
          {user.role == 'Seller' ? (
            <Tooltip title="Refresh">
              <button
                className="py-2 px-3 rounded hover:bg-[#f1f5f9] cursor-pointer"
                onClick={() => {
                  getAllAds(filters);
                  toast.success('Refresh success!');
                }}
              >
                <MdOutlineRefresh size={20} />
              </button>
            </Tooltip>
          ) : (
            <></>
          )}
        </div>

        {viewMode === 'daily' ? renderDailyList() : renderAccountsView()}
      </div>
    </div>
  );
};

export default AdsReport;
