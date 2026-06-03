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
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const MIN_STAGE_SCALE = 0.25;
const MAX_STAGE_SCALE = 50;
const ZOOM_STEP = 1.15;
const SHIFT_SCROLL_PAN_MULTIPLIER = 0.45;

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

const defaultGetItemId = (item) => item?.orderItemId;

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
  draggable = true,
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

  const handleDragEnd = useCallback((e) => onChange({ x: e.target.x(), y: e.target.y() }), [onChange]);

  const handleDragMove = useCallback((e) => onChange({ x: e.target.x(), y: e.target.y() }), [onChange]);

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

  if (!htmlImg) return null;

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
        draggable={draggable}
        onClick={onSelect}
        onTap={onSelect}
        perfectDrawEnabled={false}
        onDragMove={handleDragMove}
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
  confirmHandler = scaleFulfill,
  getItemId = defaultGetItemId,
  platform = 'amazon',
  // NEW: parent sẽ nhận (orderId, orderItemId) và chuyển sang target kế tiếp trong queue Pending
  onNextAfter,
}) {
  const [bgColor, setBgColor] = useState('#2f6f8a');
  const [qcNote, setQcNote] = useState('');
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(indexQC);
  const [errorNote, setErrorNote] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const [activeLayer, setActiveLayer] = useState(null);
  const [decisionByItem, setDecisionByItem] = useState({});
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const stageRef = useRef(null);
  const panStartRef = useRef(null);

  /* -------- Derived values -------- */
  const totalItems = orderInfo?.items?.length || 0;

  const currentItem = useMemo(() => (totalItems ? orderInfo.items[currentIndex] : undefined), [orderInfo, totalItems, currentIndex]);
  const currentItemId = useMemo(() => getItemId(currentItem), [currentItem, getItemId]);

  const customItems = useMemo(() => {
    if (Array.isArray(currentItem?.version3Data)) return currentItem.version3Data;
    if (currentItem?.variations && typeof currentItem.variations === 'object') {
      return Object.entries(currentItem.variations).map(([label, value]) => ({ label, value }));
    }
    return [];
  }, [currentItem]);

  const csNote = useMemo(() => currentItem?.cs_note ?? '', [currentItem?.cs_note]);

  const layersData = useMemo(() => {
    const ff = currentItem?.fulfillment_file;
    // console.log('[QC] currentItem:', currentItem);
    // console.log('[QC] fulfillment_file raw:', ff);
    if (!ff) {
      // console.warn('[QC] fulfillment_file is empty/undefined → no layers');
      return [];
    }
    const result = Object.entries(ff).map(([key, url]) => ({
      id: key.replace(/_/g, ''),
      label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      url,
    }));
    // console.log('[QC] layersData built:', result);
    return result;
  }, [currentItem]);

  const displayScale = useMemo(
    () => Math.min(viewportWidth / logicalWidth, viewportHeight / logicalHeight),
    [viewportWidth, viewportHeight, logicalWidth, logicalHeight]
  );

  const sizeInfo = useMemo(() => {
    const active = activeLayer ? items.find((x) => x.id === activeLayer) : items.length === 1 ? items[0] : null;
    if (!active?.originalWidth || !active?.originalHeight) return null;
    return { wPx: active.originalWidth, hPx: active.originalHeight };
  }, [items, activeLayer]);

  const selectedItem = useMemo(() => (activeLayer ? items.find((x) => x.id === activeLayer) : null), [items, activeLayer]);

  /* -------- Handlers -------- */
  const handlePageChange = useCallback((page) => setCurrentIndex(page - 1), []);

  const selectId = useCallback((id) => {
    setItems((arr) => arr.map((it) => ({ ...it, isSelected: it.id === id })));
    setActiveLayer(id);
  }, []);

  const makeSelectHandler = useCallback((id) => () => selectId(id), [selectId]);

  const clearSelection = useCallback(() => {
    setItems((arr) => arr.map((it) => ({ ...it, isSelected: false })));
    setActiveLayer(null);
  }, []);

  const updateItem = useCallback((id, patch) => {
    setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const makeUpdateHandler = useCallback((id) => (patch) => updateItem(id, patch), [updateItem]);

  const resetViewport = useCallback(() => {
    setStageScale(1);
    setStagePos({ x: 0, y: 0 });
  }, []);

  const setZoomFromPoint = useCallback(
    (nextScale, pointer) => {
      const clampedScale = clamp(nextScale, MIN_STAGE_SCALE, MAX_STAGE_SCALE);
      if (!pointer) {
        setStageScale(clampedScale);
        return;
      }

      const mousePointTo = {
        x: (pointer.x - stagePos.x) / stageScale,
        y: (pointer.y - stagePos.y) / stageScale,
      };

      setStageScale(clampedScale);
      setStagePos({
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      });
    },
    [stagePos.x, stagePos.y, stageScale]
  );

  const zoomIn = useCallback(() => {
    setZoomFromPoint(stageScale * ZOOM_STEP, { x: viewportWidth / 2, y: viewportHeight / 2 });
  }, [setZoomFromPoint, stageScale, viewportHeight, viewportWidth]);

  const zoomOut = useCallback(() => {
    setZoomFromPoint(stageScale / ZOOM_STEP, { x: viewportWidth / 2, y: viewportHeight / 2 });
  }, [setZoomFromPoint, stageScale, viewportHeight, viewportWidth]);

  const handleStageWheel = useCallback(
    (e) => {
      e.evt.preventDefault();
      const { ctrlKey, metaKey, shiftKey, deltaX, deltaY } = e.evt;

      if (ctrlKey || metaKey) {
        const stage = stageRef.current;
        const pointer = stage?.getPointerPosition();
        const nextScale = deltaY > 0 ? stageScale / ZOOM_STEP : stageScale * ZOOM_STEP;
        setZoomFromPoint(nextScale, pointer);
        return;
      }

      setStagePos((prev) => ({
        x: prev.x - (shiftKey ? deltaY * SHIFT_SCROLL_PAN_MULTIPLIER : deltaX),
        y: shiftKey ? prev.y : prev.y - deltaY,
      }));
    },
    [setZoomFromPoint, stageScale]
  );

  const handleStageMouseDown = useCallback(
    (e) => {
      const stage = stageRef.current;
      const pointer = stage?.getPointerPosition();
      const shouldPan = e.evt.button === 1 || (isSpaceDown && e.evt.button === 0);

      if (shouldPan && pointer) {
        e.evt.preventDefault();
        setIsPanning(true);
        panStartRef.current = {
          pointer,
          stagePos,
        };
        stage.container().style.cursor = 'grabbing';
        return;
      }

      if (e.target === stage) {
        clearSelection();
      }
    },
    [clearSelection, isSpaceDown, stagePos]
  );

  const handleStageMouseMove = useCallback(() => {
    if (!isPanning || !panStartRef.current) return;
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!pointer) return;

    const { pointer: startPointer, stagePos: startStagePos } = panStartRef.current;
    setStagePos({
      x: startStagePos.x + pointer.x - startPointer.x,
      y: startStagePos.y + pointer.y - startPointer.y,
    });
  }, [isPanning]);

  const stopPanning = useCallback(() => {
    if (!isPanning) return;
    setIsPanning(false);
    panStartRef.current = null;
    const stage = stageRef.current;
    if (stage) {
      stage.container().style.cursor = isSpaceDown ? 'grab' : 'default';
    }
  }, [isPanning, isSpaceDown]);

  const fitSelectedLayer = useCallback(() => {
    if (!selectedItem?.originalWidth || !selectedItem?.originalHeight) return;
    const fitScale = Math.min((viewportWidth * 0.9) / selectedItem.originalWidth, (viewportHeight * 0.9) / selectedItem.originalHeight);
    const width = selectedItem.originalWidth * fitScale;
    const height = selectedItem.originalHeight * fitScale;
    updateItem(selectedItem.id, {
      width,
      height,
      x: (viewportWidth - width) / 2,
      y: (viewportHeight - height) / 2,
    });
  }, [selectedItem, updateItem, viewportHeight, viewportWidth]);

  const actualSizeSelectedLayer = useCallback(() => {
    if (!selectedItem?.originalWidth || !selectedItem?.originalHeight) return;
    const width = selectedItem.originalWidth * displayScale;
    const height = selectedItem.originalHeight * displayScale;
    updateItem(selectedItem.id, {
      width,
      height,
      x: (viewportWidth - width) / 2,
      y: (viewportHeight - height) / 2,
    });
  }, [displayScale, selectedItem, updateItem, viewportHeight, viewportWidth]);

  const centerSelectedLayer = useCallback(() => {
    if (!selectedItem) return;
    updateItem(selectedItem.id, {
      x: (viewportWidth - (selectedItem.width || 0)) / 2,
      y: (viewportHeight - (selectedItem.height || 0)) / 2,
    });
  }, [selectedItem, updateItem, viewportHeight, viewportWidth]);

  const resetSelectedLayer = useCallback(() => {
    if (!selectedItem) return;
    updateItem(selectedItem.id, {
      x: selectedItem.initialX ?? 0,
      y: selectedItem.initialY ?? 0,
      width: selectedItem.initialWidth ?? selectedItem.width,
      height: selectedItem.initialHeight ?? selectedItem.height,
      rotation: selectedItem.initialRotation ?? 0,
    });
  }, [selectedItem, updateItem]);

  const goNextTarget = useCallback(() => {
    // Ưu tiên nhảy sang item/order kế tiếp (parent quản lý)
    if (onNextAfter && orderInfo?.orderId && currentItemId) {
      onNextAfter(orderInfo.orderId, currentItemId);
      return;
    }
    // fallback: đóng modal
    onClose?.();
  }, [onNextAfter, orderInfo?.orderId, currentItemId, onClose]);

  const handlePass = useCallback(async () => {
    try {
      const res = await confirmHandler(
        orderInfo?.orderId,
        currentItemId,
        {
          decision: 'approve',
          note: qcNote,
        },
        { shopId: orderInfo?.shopId }
      );
      if (res.status === 200) toast.success(res.data?.message);
      setDecisionByItem((prev) => ({ ...prev, [currentItemId]: 'approved' }));
    } catch (e) {
      console.log(e);
      toast.error('Error');
    } finally {
      fetchAllQC?.(filters);
      fetchCountStatus?.();
      goNextTarget();
    }
  }, [confirmHandler, orderInfo?.orderId, orderInfo?.shopId, currentItemId, qcNote, fetchAllQC, filters, fetchCountStatus, goNextTarget]);

  const handleReject = useCallback(async () => {
    if (!qcNote) {
      setErrorNote(true);
      return;
    }
    try {
      const res = await confirmHandler(
        orderInfo?.orderId,
        currentItemId,
        {
          decision: 'reject',
          note: qcNote,
        },
        { shopId: orderInfo?.shopId }
      );
      if (res.status === 200) toast.success(res.data?.message);
      setDecisionByItem((prev) => ({ ...prev, [currentItemId]: 'rejected' }));
    } catch (e) {
      console.log(e);
      toast.error('Error');
    } finally {
      fetchAllQC?.(filters);
      fetchCountStatus?.();
      goNextTarget();
    }
  }, [confirmHandler, orderInfo?.orderId, orderInfo?.shopId, currentItemId, qcNote, fetchAllQC, filters, fetchCountStatus, goNextTarget]);

  /* -------- Side effects -------- */
  useEffect(() => {
    setCurrentIndex(indexQC);
  }, [indexQC]);

  useEffect(() => {
    // reset khi đổi order
    setQcNote('');
    setErrorNote(false);
    setActiveLayer(null);
    setItems([]);
    setShowBack(false);
    resetViewport();
  }, [orderInfo?.orderId, resetViewport]);

  useEffect(() => {
    // reset note khi đổi item
    setQcNote(currentItem?.qc_note || '');
    setErrorNote(false);
    setActiveLayer(null);
    resetViewport();
  }, [currentItemId, currentItem?.qc_note, resetViewport]);

  useEffect(() => {
    if (!open) return undefined;

    const isTextInput = (target) => ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName);

    const handleKeyDown = (e) => {
      if (isTextInput(e.target)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsSpaceDown(true);
        const stage = stageRef.current;
        if (stage && !isPanning) stage.container().style.cursor = 'grab';
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setIsSpaceDown(false);
        const stage = stageRef.current;
        if (stage && !isPanning) stage.container().style.cursor = 'default';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPanning, open]);

  useEffect(() => {
    // map trạng thái server -> decisionByItem (để hiển thị Passed/Rejected)
    const map = {};
    (orderInfo?.items || []).forEach((it) => {
      const itemId = getItemId(it);
      const st = String(it?.scale_status || '').toLowerCase();
      if (st === 'ready' || st === 'approved' || st === 'complete') map[itemId] = 'approved';
      if (st === 'qc rejected' || st === 'rejected') map[itemId] = 'rejected';
    });
    setDecisionByItem((prev) => ({ ...map, ...prev }));
  }, [orderInfo, getItemId]);

  useEffect(() => {
    if (!open) return;
    if (!layersData.length) {
      // console.warn('[QC] layersData empty → clear items');
      return setItems([]);
    }

    // console.log('[QC] start loading layers:', layersData.length, 'displayScale:', displayScale);

    let cancelled = false;

    Promise.all(
      layersData.map(
        (x, i) =>
          new Promise((resolve) => {
            const it = normalizeLayer(x, i);
            if (!it.url) {
              // console.warn(`[QC] layer ${it.id} has no url → skipped image load`, it);
              return resolve(it);
            }

            const img = new window.Image();
            // img.crossOrigin = 'anonymous';
            img.onload = () => {
              if (cancelled) return resolve(null);
              const originalWidth = img.width;
              const originalHeight = img.height;
              const width = originalWidth * displayScale;
              const height = originalHeight * displayScale;
              const x = (viewportWidth - width) / 2;
              const y = (viewportHeight - height) / 2;
              // console.log(`[QC] layer ${it.id} loaded:`, {
              //   url: it.url,
              //   originalWidth,
              //   originalHeight,
              // });
              resolve({
                ...it,
                htmlImg: img,
                originalWidth,
                originalHeight,
                x,
                y,
                width,
                height,
                initialX: x,
                initialY: y,
                initialWidth: width,
                initialHeight: height,
                initialRotation: it.rotation,
              });
            };
            img.onerror = () => {
              // console.error(`[QC] layer ${it.id} failed to load:`, it.url, err);
              resolve(it);
            };
            img.src = it.url;
          })
      )
    ).then((arr) => {
      if (!cancelled) {
        const finalItems = arr.filter(Boolean);
        // console.log('[QC] items resolved:', finalItems.map((i) => ({
        //   id: i.id,
        //   hasImg: !!i.htmlImg,
        //   width: i.width,
        //   height: i.height,
        //   url: i.url,
        // })));
        setItems(finalItems);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, layersData, displayScale, viewportHeight, viewportWidth]);

  /* -------- UI derived -------- */
  const decidedStatus = useMemo(() => (currentItemId ? decisionByItem[currentItemId] : undefined), [decisionByItem, currentItemId]);

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

  const handleCopy = useCallback(async (textToCopy) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.info('Copied to clipboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to copy!');
    }
  }, []);

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

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tooltip title="Zoom out">
              <Button size="small" onClick={zoomOut}>
                -
              </Button>
            </Tooltip>
            <Tooltip title="Reset viewport">
              <Button size="small" onClick={resetViewport}>
                {Math.round(stageScale * 100)}%
              </Button>
            </Tooltip>
            <Tooltip title="Zoom in">
              <Button size="small" onClick={zoomIn}>
                +
              </Button>
            </Tooltip>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tooltip title="Fit selected layer to canvas">
              <Button size="small" disabled={!selectedItem} onClick={fitSelectedLayer}>
                Fit
              </Button>
            </Tooltip>
            <Tooltip title="Center selected layer">
              <Button size="small" disabled={!selectedItem} onClick={centerSelectedLayer}>
                Center
              </Button>
            </Tooltip>
            <Tooltip title="Reset selected layer">
              <Button size="small" disabled={!selectedItem} onClick={resetSelectedLayer}>
                Reset
              </Button>
            </Tooltip>
            <Tooltip title="Preview selected layer at source scale">
              <Button size="small" disabled={!selectedItem} onClick={actualSizeSelectedLayer}>
                1:1
              </Button>
            </Tooltip>
          </div>

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
          <Stage
            ref={stageRef}
            width={viewportWidth}
            height={viewportHeight}
            onWheel={handleStageWheel}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={stopPanning}
            onMouseLeave={stopPanning}
          >
            <Layer listening={false} imageSmoothingEnabled>
              <Rect x={0} y={0} width={viewportWidth} height={viewportHeight} fill={bgColor} />
            </Layer>
            <Layer imageSmoothingEnabled>
              <Group x={stagePos.x} y={stagePos.y} scaleX={stageScale} scaleY={stageScale}>
                {items.map((it) => (
                  <EditableImage
                    key={it.id}
                    {...it}
                    draggable={!isSpaceDown && !isPanning}
                    onSelect={makeSelectHandler(it.id)}
                    onChange={makeUpdateHandler(it.id)}
                  />
                ))}
              </Group>
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

                  <button className="cursor-pointer" onClick={() => handleCopy(orderInfo?.orderId)}>
                    <StatusComponent title={orderInfo?.orderId} color={dataColors.pink} />
                  </button>
                </div>
                {platform !== 'etsy' && currentItem?.asin && (
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
                )}
                {platform === 'etsy' && currentItem?.listingId && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Listing ID:</span>
                    <StatusComponent title={currentItem?.listingId} color={dataColors.pending} />
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-medium">Sku:</span>
                  <StatusComponent title={currentItem?.sku} color={dataColors.asin} />
                </div>

                {orderInfo?.scaledBy && (
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Scale By:</span>
                    <StatusComponent title={orderInfo?.scaledBy?.full_name} color={dataColors.process} />
                  </div>
                )}

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
                      {`${orderInfo?.orderId}-${currentItemId}`}
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
              {customItems.map((item, idx) => (
                <div key={idx} className="mb-1 whitespace-normal break-words">
                  <span className="font-medium">{item?.label}:</span>
                  <span className="text-[#64748B] ml-2">{item?.value ? item?.value : <span className="text-red-500">x</span>}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Title level={5} style={{ marginTop: 0 }}>
              CS Note
            </Title>
            <Input.TextArea
              value={csNote}
              spellCheck={false}
              readOnly
              placeholder="No CS note"
              autoSize={{ minRows: 3, maxRows: 8 }}
              style={{ color: dataColors.cancelled, fontWeight: 500, marginBottom: 12 }}
            />

            <Title level={5} style={{ marginTop: 0 }}>
              QC Note
            </Title>
            <Input.TextArea
              value={qcNote}
              spellCheck={false}
              style={{ borderColor: errorNote ? '#FB2C36' : '' }}
              onChange={(e) => {
                setQcNote(e.target.value);
                setErrorNote(false);
              }}
              placeholder="Enter notes for seller…"
              autoSize={{ minRows: 3, maxRows: 12 }}
            />
            {errorNote && <div className="text-red-500 font-medium mt-1">Please note!</div>}
          </div>
        </Flex>
      </div>
    </Modal>
  );
}
