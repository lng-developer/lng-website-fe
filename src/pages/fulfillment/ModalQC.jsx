import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

/* ===================== Utilities ===================== */
const num = (v, d) => (Number.isFinite(+v) ? +v : d);

const normalizeLayer = (x, i) => ({
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
  originalWidth: null,
  originalHeight: null,
});

/* ===================== EditableImage (pure) ===================== */
const EditableImage = React.memo(function EditableImage({
  htmlImg,
  x,
  y,
  width,
  height,
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

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleDragEnd = useCallback((e) => onChange({ x: e.target.x(), y: e.target.y() }), [onChange]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleTransformEnd = useCallback(() => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    const prevW = width || htmlImg.width;
    const prevH = height || htmlImg.height;

    const nextW = Math.max(20, prevW * scaleX);
    const nextH = Math.max(20, prevH * scaleY);

    node.scaleX(1);
    node.scaleY(1);

    onChange({
      x: node.x(),
      y: node.y(),
      width: nextW,
      height: nextH,
    });
  }, [onChange, width, height, htmlImg?.width, htmlImg?.height]);

  return (
    <Group>
      <KonvaImage
        ref={shapeRef}
        image={htmlImg}
        x={x}
        y={y}
        width={width || htmlImg.width}
        height={height || htmlImg.height}
        rotation={rotation}
        opacity={opacity}
        visible={visible}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        perfectDrawEnabled={false}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          resizeEnabled
          keepRatio
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          padding={6}
          borderEnabled
          borderStroke="#1677ff"
          borderStrokeWidth={2}
          anchorSize={8}
          anchorFill="#ffffff"
          anchorStroke="#1677ff"
          anchorStrokeWidth={1}
          boundBoxFunc={(oldBox, newBox) => {
            const MIN = 20;
            if (newBox.width < MIN || newBox.height < MIN) return oldBox;
            return newBox;
          }}
        />
      )}
    </Group>
  );
});

/* ===================== Modal ===================== */
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
  const [bgColor, setBgColor] = useState('#2f6f8a');
  const [qcNote, setQcNote] = useState('');
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(indexQC);
  const [errorNote, setErrorNote] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const [activeLayer, setActiveLayer] = useState(null);
  const [decisionByItem, setDecisionByItem] = useState({});

  /* -------- Derived values (memo) -------- */
  const totalItems = orderInfo?.items?.length || 0;

  const currentItem = useMemo(() => (totalItems ? orderInfo.items[currentIndex] : undefined), [orderInfo, totalItems, currentIndex]);

  const layersData = useMemo(() => {
    const ff = currentItem?.fulfillment_file;
    if (!ff) return [];
    return Object.entries(ff).map(([key, url]) => ({
      id: key.replace(/_/g, ''),
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      url,
    }));
  }, [currentItem]);

  const displayScale = useMemo(
    () => Math.min(viewportWidth / logicalWidth, viewportHeight / logicalHeight),
    [viewportWidth, viewportHeight, logicalWidth, logicalHeight]
  );

  const isSingleItem = totalItems <= 1;

  const sizeInfo = useMemo(() => {
    const active = activeLayer ? items.find((x) => x.id === activeLayer) : items.length === 1 ? items[0] : null;

    if (!active?.originalWidth || !active?.originalHeight) return null;
    return { wPx: active.originalWidth, hPx: active.originalHeight };
  }, [items, activeLayer]);

  /* -------- Handlers (callback) -------- */
  const handlePageChange = useCallback((page) => setCurrentIndex(page - 1), []);

  const selectId = useCallback((id) => {
    setItems((arr) => arr.map((it) => ({ ...it, isSelected: it.id === id })));
    setActiveLayer(id);
  }, []);

  const makeSelectHandler = useCallback((id) => () => selectId(id), [selectId]);

  const updateItem = useCallback((id, patch) => {
    setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const makeUpdateHandler = useCallback((id) => (patch) => updateItem(id, patch), [updateItem]);

  const goNextOrClose = useCallback(() => {
    if (isSingleItem) {
      onClose?.();
    } else {
      setCurrentIndex((i) => {
        const next = i + 1;
        return next < totalItems ? next : Math.max(0, i - 1);
      });
    }
    setQcNote('');
  }, [isSingleItem, onClose, totalItems]);

  const handlePass = useCallback(async () => {
    try {
      const res = await scaleFulfill(orderInfo?.orderId, currentItem?.orderItemId, {
        decision: 'approve',
        note: qcNote,
      });
      if (res.status === 200) toast.success(res.data?.message);
      setDecisionByItem((prev) => ({ ...prev, [currentItem?.orderItemId]: 'approved' }));
    } catch (e) {
      console.log(e);

      toast.error('Error');
    } finally {
      fetchAllQC?.(filters);
      fetchCountStatus?.();
      goNextOrClose();
    }
  }, [orderInfo?.orderId, currentItem?.orderItemId, qcNote, fetchAllQC, filters, fetchCountStatus, goNextOrClose]);

  const handleReject = useCallback(async () => {
    if (!qcNote) {
      setErrorNote(true);
      return;
    }
    try {
      const res = await scaleFulfill(orderInfo?.orderId, currentItem?.orderItemId, {
        decision: 'reject',
        note: qcNote,
      });
      if (res.status === 200) toast.success(res.data?.message);
      setDecisionByItem((prev) => ({ ...prev, [currentItem?.orderItemId]: 'rejected' }));
    } catch (e) {
      console.log(e);
      toast.error('Error');
    } finally {
      fetchAllQC?.(filters);
      fetchCountStatus?.();
      goNextOrClose();
    }
  }, [orderInfo?.orderId, currentItem?.orderItemId, qcNote, fetchAllQC, filters, fetchCountStatus, goNextOrClose]);

  /* -------- Side effects -------- */
  useEffect(() => {
    setCurrentIndex(indexQC);
  }, [indexQC]);

  // Pre-mark decisions from server
  useEffect(() => {
    const map = {};
    (orderInfo?.items || []).forEach((it) => {
      const st = String(it?.scale_status || '').toLowerCase();
      if (st === 'ready' || st === 'approved' || st === 'complete') map[it.orderItemId] = 'approved';
      if (st === 'qc rejected' || st === 'rejected') map[it.orderItemId] = 'rejected';
    });
    setDecisionByItem((prev) => ({ ...map, ...prev }));
  }, [orderInfo]);

  // Load images when modal opens or current item changes
  useEffect(() => {
    if (!open) return;
    if (!layersData.length) return setItems([]);

    let cancelled = false;

    Promise.all(
      layersData.map(
        (x, i) =>
          new Promise((resolve) => {
            const it = normalizeLayer(x, i);
            if (!it.url) return resolve(it);

            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              if (cancelled) return resolve(null);
              const originalWidth = img.width;
              const originalHeight = img.height;
              resolve({
                ...it,
                htmlImg: img,
                originalWidth,
                originalHeight,
                x: (it.x || 0) * displayScale,
                y: (it.y || 0) * displayScale,
                width: originalWidth * displayScale,
                height: originalHeight * displayScale,
              });
            };
            img.onerror = () => resolve(it);
            img.src = it.url;
          })
      )
    ).then((arr) => {
      if (!cancelled) setItems(arr.filter(Boolean));
    });

    return () => {
      cancelled = true;
    };
  }, [open, layersData, displayScale]);

  /* -------- Derived UI bits (memo) -------- */
  const decidedStatus = useMemo(() => (currentItem ? decisionByItem[currentItem.orderItemId] : undefined), [decisionByItem, currentItem]);

  const showActionButtons = useMemo(
    () => String(currentItem?.scale_status).toLowerCase() === 'pending' && !decidedStatus,
    [currentItem?.scale_status, decidedStatus]
  );

  const serverStatusIcon = useMemo(() => {
    const serverSt = String(currentItem?.scale_status || '').toLowerCase();
    if (serverSt === 'ready' || serverSt === 'approved' || serverSt === 'complete') {
      return (
        <div className="flex items-center gap-2">
          <FcApproval size={20} />
          <span className="font-medium text-[#39a00d]">Passed</span>
        </div>
      );
    }
    if (serverSt === 'qc rejected' || serverSt === 'rejected') {
      return (
        <div className="flex items-center gap-2">
          <IoArrowUndo size={18} color="#cd1323" />
          <span className="font-medium text-[#cd1323]">Rejected</span>
        </div>
      );
    }
    return null;
  }, [currentItem?.scale_status]);

  return (
    <Modal width={1350} open={open} onCancel={onClose} title={null} footer={null} style={{ top: '5%' }}>
      {/* ======= HEADER ======= */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ margin: 0, width: 220 }}>QC Preview</h1>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'space-between', width: 700, marginLeft: 16 }}>
          <div className="flex items-center">
            <Pagination
              total={currentItem ? totalItems : 1}
              showTotal={(total) => (
                <span className="font-medium whitespace-nowrap">
                  Item {currentIndex + 1}/{total}
                </span>
              )}
              pageSize={1}
              current={currentIndex + 1}
              onChange={handlePageChange}
              simple
              size="large"
              onShowSizeChange={handlePageChange}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            />
          </div>

          {/* Size box */}
          <div
            style={{
              minWidth: 150,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: '6px 10px',
              background: '#fff',
              fontWeight: 500,
              color: '#111827',
            }}
          >
            {sizeInfo ? (
              <>
                <span>Size:&nbsp;</span>
                <span className="whitespace-nowrap">
                  {sizeInfo.wPx}×{sizeInfo.hPx} px
                </span>
              </>
            ) : (
              <span>Size: —</span>
            )}
          </div>

          {/* Background color + Back */}
          <div className="flex items-center">
            {showBack && (
              <div
                className="mr-5"
                style={{ cursor: 'pointer', border: '1px solid #e5e7eb', borderRadius: 8, padding: 6, background: '#fff' }}
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

        {/* Status / Actions */}
        <div className="flex mr-10 w-[300px] ml-[15px]">
          {decidedStatus === 'approved' && (
            <div className="flex items-center gap-2">
              <FcApproval size={20} />
              <span className="font-medium text-[#39a00d]">Passed</span>
            </div>
          )}
          {decidedStatus === 'rejected' && (
            <div className="flex items-center gap-2">
              <IoArrowUndo size={18} color="#cd1323" />
              <span className="font-medium text-[#cd1323]">Rejected</span>
            </div>
          )}
          {!decidedStatus && showActionButtons && (
            <div className="flex gap-2">
              <Button
                type="dashed"
                iconPosition="end"
                icon={<FcApproval />}
                onClick={handlePass}
                style={{ fontWeight: 500 }}
                className="hover:!text-[#39a00d] hover:!border-[#39a00d]"
              >
                Passed
              </Button>
              <Button
                type="dashed"
                iconPosition="end"
                icon={<IoArrowUndo color="red" />}
                onClick={handleReject}
                style={{ fontWeight: 500 }}
                className="hover:!text-[#cd1323] hover:!border-[#cd1323]"
              >
                Reject
              </Button>
            </div>
          )}
          {!decidedStatus && !showActionButtons && serverStatusIcon}
        </div>
      </div>

      {/* ======= BODY ======= */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* LEFT: thumbnails */}
        <div style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: 12 }} className="overflow-auto">
          {currentItem?.listing?.product_image && (
            <img
              src={currentItem?.listing?.product_image}
              style={{ width: '100%', border: '1px solid #ddd', borderRadius: 8, objectFit: 'cover' }}
              alt="mockup"
            />
          )}
          {layersData.map((l) => (
            <div key={l.id}>
              <div
                onClick={makeSelectHandler(l.id)}
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

        {/* MIDDLE: canvas */}
        <div
          className="relative rounded-xl"
          style={{ width: viewportWidth, height: viewportHeight, overflow: 'hidden', background: bgColor }}
        >
          <Stage width={viewportWidth} height={viewportHeight}>
            <Layer listening={false} imageSmoothingEnabled>
              <Rect x={0} y={0} width={viewportWidth} height={viewportHeight} fill={bgColor} />
            </Layer>
            <Layer imageSmoothingEnabled>
              {(activeLayer ? items.filter((it) => it.id === activeLayer) : items).map((it) => (
                <EditableImage key={it.id} {...it} onSelect={makeSelectHandler(it.id)} onChange={makeUpdateHandler(it.id)} />
              ))}
            </Layer>
          </Stage>
        </div>

        {/* RIGHT: Info + QC Note */}
        <Flex vertical gap={10}>
          <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, maxWidth: 350 }}>
            <Title level={5} style={{ marginTop: 0 }}>
              Item Info
            </Title>
            {currentItem && (
              <Flex vertical gap={6}>
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
                {currentItem?.cost_center?.vendorProductDisplayName && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Vendor:</span>
                    <StatusComponent
                      title={currentItem?.cost_center?.vendorProductDisplayName?.split(/\s*[-–—]\s*/)[0]}
                      color={dataColors.success}
                    />
                  </div>
                )}
                {currentItem?.cost_center?.vendorProductDisplayName && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Product Name:</span>
                    <StatusComponent
                      title={currentItem?.cost_center?.vendorProductDisplayName?.replace(/^\s*.*?\s*[-–—]\s+/, '')}
                      color={dataColors.default}
                      isDefault
                    />
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-medium">Fulfill Name:</span>
                  <div
                    style={{ borderColor: dataColors.default, backgroundColor: `${dataColors.default}10`, maxWidth: 245 }}
                    className="inline-flex items-center rounded-full border-1 px-2.5 py-0.5 text-xs transition-colors font-medium text-foreground"
                  >
                    <span
                      style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block' }}
                      className="whitespace-nowrap"
                    >
                      {`${orderInfo?.orderId}-${currentItem?.orderItemId}`}
                    </span>
                  </div>
                </div>
                {currentItem?.cost_center?.vendorProductSKU && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Vendor Product Sku:</span>
                    <StatusComponent title={currentItem?.cost_center?.vendorProductSKU} color={dataColors.default} isDefault />
                  </div>
                )}
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
              maxHeight: 370,
              overflowY: 'auto',
            }}
          >
            <div className="flex-col justify-between">
              {currentItem?.version3Data?.map((item, idx) => (
                <div key={idx} className="mb-1 whitespace-normal break-words">
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
