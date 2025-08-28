import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Button, Select, Typography, Input, Space, Divider, Tooltip, Flex } from 'antd';
import { Stage, Layer, Rect, Image as KImage } from 'react-konva';
import useImage from 'use-image';
import StatusComponent from '../../components/StatusComponent';
import { dataColors } from '../../utils/dataColors';
import { Link } from 'react-router-dom';
import { RiLinkM } from 'react-icons/ri';
import { FcApproval } from 'react-icons/fc';
import { IoArrowUndo } from 'react-icons/io5';
import { scaleFulfill } from '../../apis/order';
import { toast } from 'sonner';

const { Title, Text } = Typography;

/** Ảnh tự fit vào khung stage, giữ tỉ lệ */
function FitImage({ url, stageW, stageH }) {
  const [img] = useImage(url, 'anonymous');
  const geom = useMemo(() => {
    if (!img) return null;
    const scale = Math.min(stageW / img.width, stageH / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    return { w, h, x: (stageW - w) / 2, y: (stageH - h) / 2 };
  }, [img, stageW, stageH]);

  if (!img || !geom) return null;
  return <KImage image={img} x={geom.x} y={geom.y} width={geom.w} height={geom.h} listening={false} />;
}

export default function QcCanvasModal({
  open,
  onClose,
  orderInfo = {}, // object info hiển thị (phải)
  fetchAllQC,
  filters,
  fetchCountStatus,
}) {
  const [bgColor, setBgColor] = useState('#2f5f93');
  const [qcNote, setQcNote] = useState('');
  const ORDER = ['front', 'back', 'left_sleeve', 'right_sleeve', 'collar']; // để sắp xếp nếu cần
  const filesEntries = useMemo(() => {
    const ff = orderInfo?.data?.fulfillment_file ?? {};
    // giữ thứ tự ORDER nhưng chỉ lấy key có url
    return ORDER.flatMap((k) => (ff[k] ? [[k, ff[k]]] : []));
    // hoặc đơn giản: Object.entries(ff).filter(([,url]) => !!url);
  }, [orderInfo]);

  // 2) State đang chọn
  const [selectedKind, setSelectedKind] = useState(null);
  useEffect(() => {
    setSelectedKind(filesEntries[0]?.[0] ?? null); // nếu chỉ có 1 ảnh cũng OK
  }, [filesEntries]);

  // 3) Url đang preview
  const previewUrl = selectedKind ? orderInfo?.data?.fulfillment_file?.[selectedKind] : undefined;

  const useImageSize = (url) => {
    const [width, setWidth] = useState(0);

    useEffect(() => {
      if (!url) return;
      const img = new Image();
      img.onload = () => {
        setWidth(img.width);
      };
      img.src = url;
    }, [url]);

    return width;
  };

  const handlePass = async () => {
    try {
      const response = await scaleFulfill(orderInfo?.orderId, orderInfo?.data?.orderItemId, {
        decision: 'approve',
        note: qcNote,
      });
      if (response.status === 200) {
        toast.success(response.data?.message);
      }
    } catch (error) {
      console.log(error);
      toast.error('Error');
    } finally {
      fetchAllQC(filters);
      fetchCountStatus();
      onClose?.();
    }
  };

  const handleReject = async () => {
    try {
      const response = await scaleFulfill(orderInfo?.orderId, orderInfo?.data?.orderItemId, {
        decision: 'reject',
        note: qcNote,
      });
      if (response.status === 200) {
        toast.success(response.data?.message);
      }
    } catch (error) {
      console.log(error);
      toast.error('Error');
    } finally {
      fetchAllQC(filters);
      fetchCountStatus();
      onClose?.();
    }
  };

  const widthState = useImageSize(orderInfo?.data?.fulfillment_file?.front);

  return (
    <Modal width={1300} open={open} onCancel={onClose} title={null} footer={null} style={{ top: '5%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          marginRight: orderInfo?.data?.scale_status === 'Pending' ? 154 : 365,
        }}
      >
        <h1 style={{ margin: 0 }}>QC Preview</h1>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {/* Chọn màu nền */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="font-medium">Background: </span>
            <Select
              value={bgColor}
              onChange={setBgColor}
              style={{ width: 140 }}
              options={[
                { label: 'Royal Blue', value: '#2f5f93' },
                { label: 'Black', value: '#111111' },
                { label: 'White', value: '#ffffff' },
                { label: 'Heather Grey', value: '#bdbdbd' },
                { label: 'Forest', value: '#2c5632' },
              ]}
            />
          </div>

          {orderInfo?.data?.scale_status === 'Pending' && (
            <div className="flex gap-2">
              <Button type="dashed" iconPosition="end" icon={<FcApproval />} onClick={handlePass} style={{ fontWeight: 500 }}>
                Passed
              </Button>
              <Button
                type="dashed"
                iconPosition="end"
                icon={<IoArrowUndo color="red" />}
                onClick={handleReject}
                style={{ fontWeight: 500 }}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* LEFT: Base images */}
        <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: 12 }} className="overflow-auto">
          {/* Ảnh base mockup (giữ nguyên) */}
          <img
            src={orderInfo?.data?.baseImageUrl}
            style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, objectFit: 'cover' }}
          />

          {filesEntries.length > 0 && (
            <div style={{ display: 'grid', gap: 10 }}>
              {filesEntries.map(([kind, url]) => (
                <div
                  key={kind}
                  onClick={() => setSelectedKind(kind)}
                  style={{
                    cursor: 'pointer',
                    border: selectedKind === kind ? '2px solid #1677ff' : '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: 6,
                    background: '#fff',
                  }}
                  title={kind.replace(/_/g, ' ')}
                >
                  <img
                    src={url}
                    preview={false}
                    placeholder // antd hiển thị skeleton khi load
                    fallback="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" // tránh icon vỡ
                    style={{ width: '100%', height: 150, objectFit: 'contain', borderRadius: 4 }}
                  />
                  <div style={{ marginTop: 6, fontSize: 12, textAlign: 'center', color: '#64748B' }}>
                    {kind.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MIDDLE: Preview canvas (chỉ đổi màu nền + hiển thị ảnh) */}
        <div
          style={{
            flex: 1,
            border: '1px solid #eee',
            borderRadius: 8,
            display: 'flex',
            justifyContent: 'center',
            overflow: 'hidden',
            width: widthState,
          }}
        >
          <Stage width={widthState} height={770}>
            <Layer>
              <Rect x={0} y={0} width={widthState} height={770} fill={bgColor} listening={false} />
              <FitImage url={previewUrl} stageW={widthState} stageH={770} />
            </Layer>
          </Stage>
        </div>

        {/* RIGHT: Order info + QC note */}
        <Flex vertical gap={10}>
          <div
            style={{
              flex: '0 0 300px',
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 12,
              width: 350,
            }}
          >
            <Title level={5} style={{ marginTop: 0 }}>
              Item Info
            </Title>
            <Flex vertical={true} gap={6}>
              <div className="flex justify-between items-center">
                <span className="font-medium">OrderId:</span>
                <StatusComponent title={orderInfo?.orderId} color={dataColors.pink} />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Asin:</span>
                <div className="flex gap-1 items-center">
                  <StatusComponent title={orderInfo?.data?.asin} color={dataColors.pending} />
                  <Tooltip title="Open Link">
                    <Link target="_blank" className="!text-black" to={`http://amazon.com/gp/product/${orderInfo?.data?.asin}`}>
                      <RiLinkM size={18} />
                    </Link>
                  </Tooltip>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Sku:</span>
                <StatusComponent title={orderInfo?.data?.sku} color={dataColors.asin} />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Color:</span>
                <StatusComponent title={orderInfo?.data?.cost_center?.colorValue} color={dataColors.default} isDefault={true} />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Size:</span>
                <StatusComponent title={orderInfo?.data?.cost_center?.sizeValue} color={dataColors.default} isDefault={true} />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Fulfillable Qty:</span>
                <StatusComponent title={orderInfo?.data?.quantity} color={dataColors.default} isDefault={true} />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Vendor:</span>
                <StatusComponent
                  title={orderInfo?.data?.cost_center?.vendorProductDisplayName?.split(/\s*[-–—]\s*/)[0]}
                  color={dataColors.success}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Product Name:</span>
                <StatusComponent
                  title={orderInfo?.data?.cost_center?.vendorProductDisplayName?.replace(/^\s*.*?\s*[-–—]\s+/, '')}
                  color={dataColors.default}
                  isDefault={true}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Fulfill Name:</span>
                <StatusComponent title={orderInfo?.fulfill_name || 'No data'} color={dataColors.default} isDefault={true} />
              </div>
            </Flex>
          </div>
          <div
            style={{
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 12,
              height: 'auto',
              width: 350,
              maxHeight: 270,
              overflowY: 'auto',
            }}
          >
            <div className="flex-col justify-between">
              {orderInfo?.data?.version3Data?.map((item, index) => (
                <div key={index} className="mb-1 whitespace-normal break-words">
                  <span className="font-medium">{item?.label}:</span>
                  <span className="text-[#64748B] ml-2">{item?.value ? item?.value : <span className="text-red-500">x</span>}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Title level={5} style={{ marginTop: 0 }}>
              QC Note
            </Title>
            <Input.TextArea
              defaultValue={orderInfo?.data?.qc_note || ''}
              value={qcNote}
              onChange={(e) => setQcNote(e.target.value)}
              placeholder="Nhập ghi chú cho seller…"
              autoSize={{ minRows: 6, maxRows: 12 }}
            />
          </div>
        </Flex>
      </div>
    </Modal>
  );
}
