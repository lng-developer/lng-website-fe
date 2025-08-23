import React, { useMemo, useState } from 'react';
import { Modal, Button, Select, Typography, Input, Space, Divider, Tooltip, Flex } from 'antd';
import { Stage, Layer, Rect, Image as KImage } from 'react-konva';
import useImage from 'use-image';
import StatusComponent from '../../components/StatusComponent';
import { dataColors } from '../../utils/dataColors';
import { Link } from 'react-router-dom';
import { RiLinkM } from 'react-icons/ri';
import { FcApproval } from 'react-icons/fc';
import { IoArrowUndo } from 'react-icons/io5';

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
  imageUrl, // URL ảnh render (từ PSD)
  baseImages = [], // mảng URL ảnh base (trái)
  orderInfo = {}, // object info hiển thị (phải)
  onPass,
  onReject,
  stageWidth = 900,
  stageHeight = 520,
}) {
  const [bgColor, setBgColor] = useState('#2f5f93');
  const [qcNote, setQcNote] = useState('');

  const handlePass = () => {
    onPass?.({ result: 'pass', bgColor, note: qcNote, orderInfo });
    onClose?.();
  };
  const handleReject = () => {
    onReject?.({ result: 'reject', bgColor, note: qcNote, orderInfo });
    onClose?.();
  };

  return (
    <Modal width={1400} open={open} onCancel={onClose} title={null} footer={null} style={{ top: '5%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          marginRight: 154,
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

          {/* Nút QC */}
          <div className="flex gap-2">
            <Button type="dashed" iconPosition="end" icon={<FcApproval />} onClick={handlePass} style={{ fontWeight: 500 }}>
              Passed
            </Button>
            <Button type="dashed" iconPosition="end" icon={<IoArrowUndo color="red" />} onClick={handleReject} style={{ fontWeight: 500 }}>
              Reject
            </Button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* LEFT: Base images */}
        <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {baseImages?.length ? (
            baseImages.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Base ${i + 1}`}
                style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, objectFit: 'cover' }}
              />
            ))
          ) : (
            <Text type="secondary">No base images</Text>
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
          }}
        >
          <Stage width={stageWidth} height={750}>
            <Layer>
              <Rect x={0} y={0} width={stageWidth} height={750} fill={bgColor} listening={false} />
              <FitImage url={imageUrl} stageW={stageWidth} stageH={stageHeight} />
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
                <StatusComponent title={orderInfo?.order_id} color={dataColors.pink} />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Asin:</span>
                <div className="flex gap-1 items-center">
                  <StatusComponent title={orderInfo?.asin} color={dataColors.pending} />
                  <Tooltip title="Open Link">
                    <Link target="_blank" className="!text-black" to={`http://amazon.com/gp/product/${orderInfo?.asin}`}>
                      <RiLinkM size={18} />
                    </Link>
                  </Tooltip>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Sku:</span>
                <StatusComponent title={orderInfo?.sku} color={dataColors.asin} />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Color:</span>
                <StatusComponent title={orderInfo?.color} color={dataColors.default} isDefault={true} />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Size:</span>
                <StatusComponent title={orderInfo?.size} color={dataColors.default} isDefault={true} />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Fulfillable Qty:</span>
                <StatusComponent title={orderInfo?.quantity} color={dataColors.default} isDefault={true} />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Vendor:</span>
                <StatusComponent title={orderInfo?.vendor} color={dataColors.success} />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Product Name:</span>
                <StatusComponent title={orderInfo?.product_name} color={dataColors.default} isDefault={true} />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Fulfill Name:</span>
                <StatusComponent title={orderInfo?.fulfill_name} color={dataColors.default} isDefault={true} />
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
              {orderInfo?.version3Data?.map((item, index) => (
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
