import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Button, Select, Typography, Input, Space, Divider, Tooltip, Flex, Pagination } from 'antd';
import { Stage, Layer, Rect, Image as KonvaImage, Transformer, Group } from 'react-konva';
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
function EditableImage({ htmlImg, x, y, scale = 1, rotation = 0, isSelected, visible = true, opacity = 1, onSelect, onChange }) {
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
        scaleX={scale}
        scaleY={scale}
        rotation={rotation}
        opacity={opacity}
        visible={visible}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const node = shapeRef.current;
          if (!node) return;
          const s = node.scaleX();
          node.scaleX(1);
          node.scaleY(1);
          onChange({ x: node.x(), y: node.y(), scale: s, rotation: node.rotation() });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
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
    scale: num(x.scale, 1),
    rotation: num(x.rotation, 0),
    visible: x.visible ?? true,
    opacity: num(x.opacity, 1),
    isSelected: false,
  };
}
function num(v, d) {
  return Number.isFinite(+v) ? +v : d;
}

export default function QcCanvasModal2({
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
  const [bgMode, setBgMode] = useState('color'); // "checker" | "color" | "transparent"
  const [bgColor, setBgColor] = useState('#2f6f8a'); // Royal-ish blue
  const [qcNote, setQcNote] = useState('');
  const [items, setItems] = useState([]);
  const stageRef = useRef(null);
  const initialLayoutDone = useRef(false);
  const [currentIndex, setCurrentIndex] = useState(indexQC);

  const currentItem = orderInfo?.items?.[currentIndex];
  const layersData = useMemo(() => {
    if (!orderInfo?.items || !orderInfo.items[currentIndex]?.fulfillment_file) return [];

    return Object.entries(orderInfo.items[currentIndex].fulfillment_file).map(([key, url]) => ({
      id: key.replace(/_/g, ''),
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      url,
      x: 900,
      y: 360,
      scale: 1,
      visible: true,
      opacity: 1,
    }));
  }, [orderInfo, currentIndex]);

  useEffect(() => {
    setCurrentIndex(indexQC);
  }, [indexQC]);

  const handlePageChange = (page) => {
    setCurrentIndex(page - 1);
  };

  // Load image elements
  useEffect(() => {
    if (!open) return; // avoid work when modal closed
    if (!Array.isArray(layersData)) return setItems([]);
    Promise.all(
      layersData.map(
        (x, i) =>
          new Promise((resolve) => {
            const it = normalizeLayer(x, i);
            if (!it.url) return resolve(it);
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve({ ...it, htmlImg: img });
            img.onerror = () => resolve(it); // resolve anyway
            img.src = it.url;
          })
      )
    ).then((arr) => setItems(arr));
  }, [open, JSON.stringify(layersData)]);

  // ===== Helpers =====
  const deselectAll = () => setItems((arr) => arr.map((it) => ({ ...it, isSelected: false })));
  const selectId = (id) => setItems((arr) => arr.map((it) => ({ ...it, isSelected: it.id === id })));
  const updateItem = (id, patch) => setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  // Scale to fit fixed viewport
  const scale = useMemo(() => {
    return Math.min(viewportWidth / logicalWidth, viewportHeight / logicalHeight);
  }, [viewportWidth, viewportHeight, logicalWidth, logicalHeight]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      const sel = items.find((x) => x.isSelected);
      if (!sel) return;
      const step = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowUp') updateItem(sel.id, { y: sel.y - step });
      if (e.key === 'ArrowDown') updateItem(sel.id, { y: sel.y + step });
      if (e.key === 'ArrowLeft') updateItem(sel.id, { x: sel.x - step });
      if (e.key === 'ArrowRight') updateItem(sel.id, { x: sel.x + step });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, items]);

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
      onClose?.();
    }
  };

  const handleReject = async () => {
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
      onClose?.();
    }
  };

  useEffect(() => {
    if (!open) return;
    if (!items.length) return;
    if (initialLayoutDone.current) return;
    initialLayoutDone.current = true;

    setItems((arr) =>
      arr.map((it) => {
        // Giữ (0,0) cho tất cả layer từ normalizeLayer
        const isRightSleeve = /(right.*sleeve|sleeve.*right)/i.test(it.id) || /(right.*sleeve|sleeve.*right)/i.test(it.label || '');
        if (isRightSleeve && it.htmlImg) {
          const factor = 0.55; // nhỏ hơn ~15%
          const newScale = (it.scale || 1) * factor;
          const h = (it.htmlImg.height || 0) * newScale;
          return {
            ...it,
            scale: newScale,
            x: 250, // canh trái
            y: Math.max(0, logicalHeight - h) - 200, // sát đáy canvas
          };
        }
        return it;
      })
    );
  }, [open, items, logicalHeight]);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="font-medium">Background: </span>
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
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

          <div>
            <div className="mb-2">
              <span className="font-medium">Customer Photo</span>
            </div>
            {currentItem?.snapshotImage && (
              <img
                src={currentItem?.snapshotImage}
                style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, objectFit: 'cover' }}
              />
            )}
          </div>
        </div>

        {/* MIDDLE: Preview canvas (chỉ đổi màu nền + hiển thị ảnh) */}
        <div
          className="relative rounded-xl"
          style={{
            width: viewportWidth,
            height: viewportHeight,
            overflow: 'hidden',
            background: bgMode === 'color' ? bgColor : 'transparent',
          }}
        >
          <Stage
            ref={stageRef}
            width={logicalWidth}
            height={logicalHeight}
            scaleX={scale}
            scaleY={scale}
            className="absolute inset-0"
            onMouseDown={(e) => {
              if (e.target === e.target.getStage()) deselectAll();
            }}
          >
            <Layer listening={false}>
              {bgMode === 'checker' && <Checkerboard w={logicalWidth} h={logicalHeight} />}
              {bgMode === 'color' && <Rect x={0} y={0} width={logicalWidth} height={logicalHeight} fill={bgColor} />}
              {bgMode === 'transparent' && <Rect x={0} y={0} width={logicalWidth} height={logicalHeight} fillEnabled={false} />}
            </Layer>
            <Layer>
              {items.map((it) => (
                <EditableImage
                  key={it.id}
                  canvasW={logicalWidth}
                  canvasH={logicalHeight}
                  {...it}
                  onSelect={() => selectId(it.id)}
                  onChange={(patch) => updateItem(it.id, patch)}
                />
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
