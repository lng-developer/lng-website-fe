import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Button, Typography, Input, Tooltip, Flex, Pagination } from 'antd';
import { Stage, Layer, Rect, Image as KonvaImage, Transformer, Group } from 'react-konva';
import StatusComponent from '../../components/StatusComponent';
import { dataColors } from '../../utils/dataColors';
import { Link } from 'react-router-dom';
import { RiLinkM } from 'react-icons/ri';
import { FcApproval } from 'react-icons/fc';
import { IoArrowUndo } from 'react-icons/io5';
import { scaleFulfill } from '../../apis/order';
import { toast } from 'sonner';
import { TfiControlBackward } from 'react-icons/tfi';

const { Title } = Typography;
function EditableImage({
  htmlImg,
  x,
  y,
  width,
  height, // ✅ dùng width/height thay cho scale
  rotation = 0,
  isSelected,
  visible = true,
  opacity = 1,
  onSelect,
  onChange,
}) {
  const shapeRef = useRef(null);
  const trRef = useRef(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  if (!htmlImg) return null;

  return (
    <Group>
      <KonvaImage
        ref={shapeRef}
        image={htmlImg}
        x={x}
        y={y}
        width={width || htmlImg.width} // ✅ vẽ theo kích thước thực
        height={height || htmlImg.height}
        rotation={rotation}
        opacity={opacity}
        visible={visible}
        draggable
        onClick={onSelect}
        perfectDrawEnabled={false}
        onTap={onSelect}
        onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;
          // ✅ chuyển scale thành width/height để tránh resample nhiều lần
          const newWidth = node.width() * node.scaleX();
          const newHeight = node.height() * node.scaleY();
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            x: node.x(),
            y: node.y(),
            width: newWidth,
            height: newHeight,
            rotation: node.rotation(),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 5 || newBox.height < 5 ? oldBox : newBox)}
        />
      )}
    </Group>
  );
}

function normalizeLayer(x, i) {
  return {
    id: x.id ?? `layer_${i}`,
    label: x.label ?? `Layer ${i + 1}`,
    url: x.url ?? null,
    htmlImg: null,
    x: 0,
    y: 0,
    rotation: num(x.rotation, 0),
    visible: x.visible ?? true,
    opacity: num(x.opacity, 1),
    isSelected: false,
  };
}
function num(v, d) {
  return Number.isFinite(+v) ? +v : d;
}

export default function QcCanvasModal({
  open,
  onClose,
  logicalWidth = 4200,
  logicalHeight = 4800,
  viewportWidth = 1000,
  viewportHeight = 750,
  fetchAllQC,
  filters,
  fetchCountStatus,
  orderInfo = {},
  indexQC = 0,
}) {
  const [bgColor, setBgColor] = useState('#2f6f8a'); // Royal-ish blue
  const [qcNote, setQcNote] = useState('');
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(indexQC);
  const [errorNote, setErrorNote] = useState(false);
  const currentItem = orderInfo?.items?.[currentIndex];
  const [showBack, setShowBack] = useState(false);
  const [activeLayer, setActiveLayer] = useState(null);
  const layersData = useMemo(() => {
    if (!orderInfo?.items || !orderInfo.items[currentIndex]?.fulfillment_file) return [];
    return Object.entries(orderInfo.items[currentIndex].fulfillment_file).map(([key, url]) => ({
      id: key.replace(/_/g, ''),
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      url,
    }));
  }, [orderInfo, currentIndex]);

  const displayScale = useMemo(() => {
    return Math.min(viewportWidth / logicalWidth, viewportHeight / logicalHeight);
  }, [viewportWidth, viewportHeight, logicalWidth, logicalHeight]);

  useEffect(() => {
    setCurrentIndex(indexQC);
  }, [indexQC]);

  const handlePageChange = (page) => {
    setCurrentIndex(page - 1);
  };

  // Load image elements
  useEffect(() => {
    if (!open) return;
    if (!Array.isArray(layersData)) return setItems([]);

    Promise.all(
      layersData.map(
        (x, i) =>
          new Promise((resolve) => {
            const it = normalizeLayer(x, i);
            if (!it.url) return resolve(it);

            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = async () => {
              // kích thước hiển thị (sau khi thu nhỏ)
              const dw = Math.max(1, Math.round(img.width * displayScale));
              const dh = Math.max(1, Math.round(img.height * displayScale));

              let bmp = img;
              try {
                // ✅ resize chất lượng cao ngay khi load
                bmp = await createImageBitmap(img, {
                  resizeWidth: dw,
                  resizeHeight: dh,
                  resizeQuality: 'high',
                });
              } catch {
                // fallback: dùng ảnh gốc nếu createImageBitmap không hỗ trợ
              }

              resolve({
                ...it,
                htmlImg: bmp,
                // chuyển luôn sang hệ toạ độ viewport (để vẽ 1:1)
                x: Math.round((it.x || 0) * displayScale),
                y: Math.round((it.y || 0) * displayScale),
                width: dw,
                height: dh,
              });
            };
            img.onerror = () => resolve(it);
            img.src = it.url;
          })
      )
    ).then((arr) => setItems(arr));
  }, [open, JSON.stringify(layersData), displayScale]);

  // ===== Helpers =====
  const selectId = (id) => setItems((arr) => arr.map((it) => ({ ...it, isSelected: it.id === id })));
  const updateItem = (id, patch) => setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const handlePass = async () => {
    try {
      const response = await scaleFulfill(orderInfo?.orderId, currentItem?.orderItemId, {
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
      if (orderInfo?.items && !orderInfo?.items?.length > 0) {
        onClose?.();
      }
    }
  };

  const handleReject = async () => {
    if (!qcNote) {
      setErrorNote(true);
      return;
    }
    try {
      const response = await scaleFulfill(orderInfo?.orderId, currentItem?.orderItemId, {
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
      if (orderInfo?.items && !orderInfo?.items?.length > 0) {
        onClose?.();
      }
    }
  };

  return (
    <Modal width={1350} open={open} onCancel={onClose} title={null} footer={null} style={{ top: '5%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <h1 style={{ margin: 0, width: 220 }}>QC Preview</h1>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', width: 700, marginLeft: 16 }}>
          <div className="flex items-center">
            <Pagination
              total={currentItem ? orderInfo?.items.length : 1}
              showTotal={(total) => (
                <span className="font-medium">
                  Item {currentIndex + 1}/{total}
                </span>
              )}
              pageSize={1}
              current={currentIndex + 1}
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
            />
          </div>
          {/* Chọn màu nền */}
          <div className="flex items-center">
            {showBack && (
              <div
                className="mr-5"
                style={{
                  cursor: 'pointer',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 6,
                  background: '#fff',
                }}
                onClick={() => setShowBack(false)}
              >
                <TfiControlBackward size={18} />
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="font-medium">Background: </span>
              <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex mr-10 w-[300px] ml-[15px]">
          {currentItem?.scale_status === 'Pending' && (
            <div className="flex gap-2">
              <Button
                type="dashed"
                iconPosition="end"
                icon={<FcApproval />}
                onClick={handlePass}
                style={{ fontWeight: 500 }}
                className={`hover:!text-[#39a00d] hover:!border-[#39a00d]`}
              >
                Passed
              </Button>
              <Button
                type="dashed"
                iconPosition="end"
                icon={<IoArrowUndo color="red" />}
                onClick={handleReject}
                style={{ fontWeight: 500 }}
                className={`hover:!text-[#cd1323] hover:!border-[#cd1323]`}
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
          {currentItem?.baseImageUrl && (
            <img src={currentItem?.baseImageUrl} style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, objectFit: 'cover' }} />
          )}
          {layersData.map((l) => (
            <div key={l.id}>
              <div
                onClick={() => {
                  setActiveLayer(l.id); // chọn layer
                  selectId(l.id); // nếu muốn hiển thị Transformer
                }}
                style={{
                  cursor: 'pointer',
                  border: activeLayer === l.id ? '2px solid #1677ff' : '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: activeLayer === l.id ? 6 : 7,
                  background: '#fff',
                }}
                title={l.label}
              >
                <img src={l.url} style={{ width: '100%', height: 150, objectFit: 'contain', borderRadius: 4 }} alt={l.label} />
                <div style={{ marginTop: 6, fontSize: 12, textAlign: 'center', color: '#64748B' }}>{l.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* MIDDLE: Preview canvas (chỉ đổi màu nền + hiển thị ảnh) */}
        <div
          className="relative rounded-xl"
          style={{
            width: viewportWidth,
            height: viewportHeight,
            overflow: 'hidden',
            background: bgColor,
          }}
        >
          <Stage width={viewportWidth} height={viewportHeight}>
            <Layer listening={false} imageSmoothingEnabled={true}>
              <Rect x={0} y={0} width={viewportWidth} height={viewportHeight} fill={bgColor} />
            </Layer>

            <Layer imageSmoothingEnabled={true}>
              {items
                .filter((it) => (activeLayer ? it.id === activeLayer : true)) // chỉ hiện 1 layer
                .map((it) => (
                  <EditableImage key={it.id} {...it} onSelect={() => selectId(it.id)} onChange={(patch) => updateItem(it.id, patch)} />
                ))}
            </Layer>
          </Stage>
        </div>

        {/* RIGHT: Order info + QC note */}
        <Flex vertical gap={10}>
          <div
            style={{
              flex: '0 0 280px',
              border: '1px solid #ddd',
              borderRadius: 8,
              padding: 12,
              width: 350,
            }}
          >
            <Title level={5} style={{ marginTop: 0 }}>
              Item Info
            </Title>
            {currentItem && (
              <Flex vertical={true} gap={6}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">OrderId:</span>
                  <StatusComponent title={orderInfo?.orderId} color={dataColors.pink} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Asin:</span>
                  <div className="flex gap-1 items-center">
                    <StatusComponent title={currentItem?.asin} color={dataColors.pending} />
                    <Tooltip title="Open Link">
                      <Link target="_blank" className="!text-black" to={`http://amazon.com/gp/product/${currentItem?.asin}`}>
                        <RiLinkM size={18} />
                      </Link>
                    </Tooltip>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Sku:</span>
                  <StatusComponent title={currentItem?.sku} color={dataColors.asin} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Fulfillable Qty:</span>
                  <StatusComponent title={currentItem?.quantity} color={dataColors.default} isDefault={true} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Vendor:</span>
                  <StatusComponent
                    title={currentItem?.cost_center?.vendorProductDisplayName?.split(/\s*[-–—]\s*/)[0]}
                    color={dataColors.success}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Product Name:</span>
                  <StatusComponent
                    title={currentItem?.cost_center?.vendorProductDisplayName?.replace(/^\s*.*?\s*[-–—]\s+/, '')}
                    color={dataColors.default}
                    isDefault={true}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Fulfill Name:</span>
                  <div
                    style={{ borderColor: dataColors.default, backgroundColor: `${dataColors.default}10`, maxWidth: 245 }}
                    className={`inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground`}
                  >
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'inline-block',
                      }}
                      className="whitespace-nowrap"
                    >
                      {`${orderInfo?.orderId}-${currentItem?.orderItemId}`}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Vendor Product Sku:</span>
                  <StatusComponent title={currentItem?.cost_center?.vendorProductSKU} color={dataColors.default} isDefault={true} />
                </div>
              </Flex>
            )}
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
              {currentItem &&
                currentItem?.version3Data?.map((item, index) => (
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
              defaultValue={currentItem?.qc_note || ''}
              value={qcNote}
              spellCheck={false}
              style={{ borderColor: errorNote ? '#FB2C36' : '' }}
              onChange={(e) => {
                setQcNote(e.target.value);
                setErrorNote(false);
              }}
              placeholder="Enter notes for seller…"
              autoSize={{ minRows: 5, maxRows: 12 }}
            />
            {errorNote && <div className="text-red-500 font-medium mt-1">Please note!</div>}
          </div>
        </Flex>
      </div>
    </Modal>
  );
}
