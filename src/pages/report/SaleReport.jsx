import { useOutletContext } from 'react-router-dom';
import { dataColors } from '../../utils/dataColors';
import DateRangePicker from '../../components/DateRangePicker';
import SelectFilter from '../../components/SelectFilter';
import { Flex, Table, Tag } from 'antd';
import { LuBoxes } from 'react-icons/lu';
import { FaSackDollar, FaArrowTrendUp, FaMoneyBillWave } from 'react-icons/fa6';
import { eachDayOfInterval, format, subDays } from 'date-fns';
import { useState } from 'react';

const today = new Date();
const SaleReport = () => {
  const { collapsed } = useOutletContext();
  const [days, setDays] = useState(
    eachDayOfInterval({
      start: new Date(subDays(today, 6)),
      end: new Date(today),
    }).map((d) => format(d, 'dd-MM'))
  );

  // ---- cấu hình ngày theo cột
  const dayKeys = days.map((d) => d.replace(/-/g, '_')); // ["06_08",...]

  // ---- dữ liệu thô cho 2 seller (ví dụ)
  const raw = {
    'Nguyễn Văn Huy': {
      fee: [
        16.24, 37.6, 27.1, 27.94, 10.0, 0, 0, 0, 424.7, 365.19, 371.15, 802.85, 330.76, 197.55, 27.1, 27.94, 10.0, 0, 0, 0, 424.7, 365.19,
        371.15, 802.85, 330.76, 197.55,
      ],
      opCost: [
        33.3, 34.12, 36.81, 35.41, 35.41, 0, 0, 0, 424.7, 365.19, 371.15, 802.85, 330.76, 197.55, 27.1, 27.94, 10.0, 0, 0, 0, 424.7, 365.19,
        371.15, 802.85, 330.76, 197.55,
      ],
      refund: [
        0, 0, 0, 0, 0, 0, 0, 0, 424.7, 365.19, 371.15, 802.85, 330.76, 197.55, 27.1, 27.94, 10.0, 0, 0, 0, 424.7, 365.19, 371.15, 802.85,
        330.76, 197.55,
      ],
      items: [
        13, 10, 7, 7, 14, 7, 4, 0, 424.7, 365.19, 371.15, 802.85, 330.76, 197.55, 27.1, 27.94, 10.0, 0, 0, 0, 424.7, 365.19, 371.15, 802.85,
        330.76, 197.55,
      ],
      revenue: [
        601.11, 424.7, 365.19, 371.15, 802.85, 330.76, 197.55, 0, 424.7, 365.19, 371.15, 802.85, 330.76, 197.55, 27.1, 27.94, 10.0, 0, 0, 0,
        424.7, 365.19, 371.15, 802.85, 330.76, 197.55,
      ],
      baseCost: [
        219.59, 150.24, 128.25, 135.71, 240.61, 127.52, 54.54, 0, 424.7, 365.19, 371.15, 802.85, 330.76, 197.55, 27.1, 27.94, 10.0, 0, 0, 0,
        424.7, 365.19, 371.15, 802.85, 330.76, 197.55,
      ],
      ads: [
        229.51, 209.4, 194.1, 228.5, 249.55, 295.07, 53.61, 0, 424.7, 365.19, 371.15, 802.85, 330.76, 197.55, 27.1, 27.94, 10.0, 0, 0, 0,
        424.7, 365.19, 371.15, 802.85, 330.76, 197.55,
      ],
    },
    'Phạm Thị Yến': {
      fee: [
        102.19, 72.2, 62.08, 63.1, 136.48, 56.23, 33.58, 0, 424.7, 365.19, 371.15, 802.85, 330.76, 197.55, 27.1, 27.94, 10.0, 0, 0, 0,
        424.7, 365.19, 371.15, 802.85, 330.76, 197.55,
      ],
      opCost: [
        33.3, 34.12, 36.81, 35.41, 35.41, 36.33, 38.32, 0, 424.7, 365.19, 371.15, 802.85, 330.76, 197.55, 27.1, 27.94, 10.0, 0, 0, 0, 424.7,
        365.19, 371.15, 802.85, 330.76, 197.55,
      ],
      refund: [
        0, 0, 0, 0, 0, 108.98, 0, 0, 424.7, 365.19, 371.15, 802.85, 330.76, 197.55, 27.1, 27.94, 10.0, 0, 0, 0, 424.7, 365.19, 371.15,
        802.85, 330.76, 197.55,
      ],
      items: [
        12, 9, 6, 6, 11, 6, 3, 0, 424.7, 365.19, 371.15, 802.85, 330.76, 197.55, 27.1, 27.94, 10.0, 0, 0, 0, 424.7, 365.19, 371.15, 802.85,
        330.76, 197.55,
      ],
      revenue: [
        545.21, 338.44, 300.18, 318.06, 721.15, 299.31, 180.12, 0, 424.7, 365.19, 371.15, 802.85, 330.76, 197.55, 27.1, 27.94, 10.0, 0, 0,
        0, 424.7, 365.19, 371.15, 802.85, 330.76, 197.55,
      ],
      baseCost: [
        188.24, 136.12, 114.9, 122.11, 214.22, 101.33, 45.9, 0, 424.7, 365.19, 371.15, 802.85, 330.76, 197.55, 27.1, 27.94, 10.0, 0, 0, 0,
        424.7, 365.19, 371.15, 802.85, 330.76, 197.55,
      ],
      ads: [
        205.4, 180.6, 170.3, 191.2, 210.9, 260.1, 45.8, 0, 424.7, 365.19, 371.15, 802.85, 330.76, 197.55, 27.1, 27.94, 10.0, 0, 0, 0, 424.7,
        365.19, 371.15, 802.85, 330.76, 197.55,
      ],
    },
  };

  // ---- helpers
  const $ = (n) => (n >= 0 ? `$${n.toFixed(2)}` : `-$${Math.abs(n.toFixed(2))}`);
  const roiColor = (v) => (v > 0 ? dataColors.success : v < 0 ? dataColors.cancelled : 'default');

  // profit1 = revenue - base - fee
  // profit2 = profit1 - ads - opCost - refund
  const buildRows = () => {
    const rows = [];
    Object.entries(raw).forEach(([seller, r]) => {
      const profit1 = r.revenue.map((v, i) => +(v - r.baseCost[i] - r.fee[i]).toFixed(2));
      const profit2 = r.revenue.map((v, i) => +(v - r.baseCost[i] - r.fee[i] - r.ads[i] - r.opCost[i] - r.refund[i]).toFixed(2));
      const roi = r.revenue.map((_, i) => {
        const denom = r.ads[i] + r.baseCost[i];
        return denom ? +((profit1[i] / denom) * 100).toFixed(2) : 0;
      });

      const group = [
        { type: 'Total Items', values: r.items, money: false },
        { type: 'Revenue', values: r.revenue, money: true },
        { type: 'Base cost', values: r.baseCost, money: true },
        { type: 'Ads spend', values: r.ads, money: true },
        { type: 'Fee', values: r.fee, money: true },
        { type: 'Profit 1', values: profit1, money: true },
        { type: 'ROI', values: roi, percent: true },
        { type: 'Operation Cost', values: r.opCost, money: true },
        { type: 'Refund', values: r.refund, money: true },
        { type: 'Profit 2', values: profit2, money: true },
      ];

      group.forEach((row, idx) => {
        const total = row.values.reduce((a, b) => a + b, 0);
        const record = {
          key: `${seller}-${row.type}`,
          seller,
          type: <span className="font-medium">{row.type}</span>,
          total,
          _rowSpan: idx === 0 ? group.length : 0,
        };
        dayKeys.forEach((k, i) => (record[k] = row.values[i]));
        rows.push({ ...record, _money: row.money, _percent: row.percent });
      });
    });
    return rows;
  };

  const dataSource = buildRows();

  // ---- columns antd
  const columns = [
    {
      title: (
        <span className="font-medium" style={{ color: dataColors.title }}>
          Seller
        </span>
      ),
      dataIndex: 'seller',
      align: 'center',
      fixed: 'left',
      width: 150,
      render: (val, row) => {
        // gộp ô seller cho cả block
        return {
          children: <div style={{ fontWeight: 600 }}>{val}</div>,
          props: { rowSpan: row._rowSpan },
        };
      },
    },
    {
      title: (
        <span className="font-medium" style={{ color: dataColors.title }}>
          Type
        </span>
      ),
      dataIndex: 'type',
      width: 100,
      fixed: 'left',
      render: (v) => <span style={{ color: '#475569' }}>{v}</span>,
    },
    {
      title: (
        <span className="font-medium" style={{ color: dataColors.title }}>
          Total
        </span>
      ),
      dataIndex: 'total',
      width: 100,
      align: 'right',
      fixed: 'left',
      onHeaderCell: () => ({
        style: {
          borderRight: '2px solid #e5e9eeff', // header border
        },
      }),
      onCell: () => ({
        style: {
          borderRight: '2px solid #e5e9eeff', // 👈 đậm hơn, màu tuỳ chỉnh
        },
      }),
      render: (val, row) => {
        if (row._percent)
          return (
            <span className="font-medium" style={{ color: roiColor(val) }}>
              {val.toFixed(2)}%
            </span>
          );
        if (row._money) return <span className="font-medium">{$(val)}</span>;
        return <span className="font-medium">{val}</span>;
      },
    },
    // cột tổng (tùy chọn): tính tổng theo mỗi hàng -> bỏ nếu không cần
    // { title: "Total", dataIndex: "total", width: 120, align: "right" },
    ...days.map((d, idx) => ({
      title: (
        <span className="font-medium" style={{ color: dataColors.title }}>
          {d}
        </span>
      ),
      dataIndex: dayKeys[idx],
      align: 'right',
      width: 120,
      render: (val, row) => {
        if (row._percent) {
          return val === 0 ? (
            '-'
          ) : (
            <span className="font-medium" style={{ color: roiColor(val) }}>
              {val.toFixed(2)}%
            </span>
          );
        }
        if (row._money) return val === 0 ? <span className="font-medium">$0.00</span> : <span className="font-medium">{$(val)}</span>;
        return <span className="font-medium">{val}</span>; // items
      },
    })),
  ];

  const updateFilter = (value) => {
    const dayFormat = eachDayOfInterval({
      start: new Date(value?.from),
      end: new Date(value?.to),
    }).map((d) => format(d, 'dd-MM'));
    setDays(dayFormat);
  };

  return (
    <div>
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
              updateFilter={updateFilter}
            />
          </div>
        </div>
      </div>
      <div className="mt-[60px] px-8 py-4 h-full">
        <div className="flex justify-between items-center">
          <div className="w-[24%] border border-[#e2e8f0] p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#64748b]">Total Items</div>
                <span className="text-xl font-bold" style={{ color: dataColors.process }}>
                  230
                </span>
              </div>
              <div>
                <LuBoxes size={25} color={dataColors.process} />
              </div>
            </div>
          </div>
          <div className="w-[24%] border border-[#e2e8f0] p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#64748b]">Revenue</div>
                <span className="text-xl font-bold" style={{ color: dataColors.success }}>
                  $2302
                </span>
              </div>
              <div>
                <FaSackDollar size={25} color={dataColors.success} />
              </div>
            </div>
          </div>
          <div className="w-[24%] border border-[#e2e8f0] p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#64748b]">ROI</div>
                <span className="text-xl font-bold" style={{ color: dataColors.pending }}>
                  230%
                </span>
              </div>
              <div>
                <FaArrowTrendUp size={25} color={dataColors.pending} />
              </div>
            </div>
          </div>
          <div className="w-[24%] border border-[#e2e8f0] p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[#64748b]">Profit</div>
                <span className="text-xl font-bold" style={{ color: dataColors.success }}>
                  $1233
                </span>
              </div>
              <div>
                <FaMoneyBillWave size={25} color={dataColors.success} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="flex w-[40%] gap-2">
            <div className="flex gap-2 items-center ">
              <SelectFilter
                title="Report By Seller"
                ListData={['Nguyễn Văn Huy', 'Chu Quang Hào', 'Tạ Khánh Tùng']}
                // value={shippingType}
                // onChange={(val) => {
                //   setShippingType(val);
                //   updateFilter({ shippingType: val });
                // }}
              />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Table columns={columns} dataSource={dataSource} rowKey="key" bordered={true} pagination={false} scroll={{ x: 'max-content' }} />
        </div>
      </div>
    </div>
  );
};

export default SaleReport;
