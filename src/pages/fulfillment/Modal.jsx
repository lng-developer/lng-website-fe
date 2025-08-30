import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Transformer, Group } from 'react-konva';

export default function QCPreviewModal({
  open,
  onClose,
  layersData = [],
  logicalWidth = 4200,
  logicalHeight = 4800,
  viewportWidth = 1000,
  viewportHeight = 750,
  itemInfo = {},
  leftPaneTitle = 'Assets',
  rightPaneTitle = 'Item Info',
}) {
  const [bgMode, setBgMode] = useState('color'); // "checker" | "color" | "transparent"
  const [bgColor, setBgColor] = useState('#2f6f8a'); // Royal-ish blue
  const [exportTransparent, setExportTransparent] = useState(false);

  const [items, setItems] = useState([]);
  const stageRef = useRef(null);
  const initialLayoutDone = useRef(false);

  const getSize = (it) => {
    const w = (it.htmlImg?.width || 0) * (it.scale || 1);
    const h = (it.htmlImg?.height || 0) * (it.scale || 1);
    return { w, h };
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
  const removeItem = (id) => setItems((arr) => arr.filter((x) => x.id !== id));
  const moveLayer = (id, dir) =>
    setItems((arr) => {
      const i = arr.findIndex((x) => x.id === id);
      if (i < 0) return arr;
      const j = dir === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= arr.length) return arr;
      const next = [...arr];
      const [sp] = next.splice(i, 1);
      next.splice(j, 0, sp);
      return next;
    });

  // Scale to fit fixed viewport
  const scale = useMemo(() => {
    return Math.min(viewportWidth / logicalWidth, viewportHeight / logicalHeight);
  }, [viewportWidth, viewportHeight, logicalWidth, logicalHeight]);

  const handleExport = () => {
    if (!stageRef.current) return;
    const old = bgMode;
    if (exportTransparent) setBgMode('transparent');
    const uri = stageRef.current.toDataURL({ mimeType: 'image/png' });
    if (exportTransparent) setBgMode(old);
    const a = document.createElement('a');
    a.href = uri;
    a.download = `merged_${logicalWidth}x${logicalHeight}_${Date.now()}.png`;
    a.click();
  };

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
          const factor = 0.65; // nhỏ hơn ~15%
          const newScale = (it.scale || 1) * factor;
          const h = (it.htmlImg.height || 0) * newScale;
          return {
            ...it,
            scale: newScale,
            x: 0, // canh trái
            y: Math.max(0, logicalHeight - h), // sát đáy canvas
          };
        }
        return it;
      })
    );
  }, [open, items, logicalHeight]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* modal container */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="w-full max-w-[1400px] h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden grid grid-cols-12">
          {/* Left pane */}
          <aside className="col-span-3 h-full overflow-y-auto border-r">
            <div className="p-4">
              <div className="text-lg font-semibold mb-3">{leftPaneTitle}</div>

              {/* Canvas/viewport info */}
              <div className="mb-4 p-3 rounded-xl bg-neutral-50 border">
                <div className="font-medium">Canvas (fixed)</div>
                <div className="text-xs mt-1 space-y-1">
                  <div>
                    Logical: <b>{logicalWidth}</b> × <b>{logicalHeight}</b> px
                  </div>
                  <div>
                    Viewport: <b>{viewportWidth}</b> × <b>{viewportHeight}</b> px
                  </div>
                  <div>
                    Scale preview: <b>{(scale * 100).toFixed(1)}%</b>
                  </div>
                </div>
              </div>

              {/* Background */}
              <div className="mb-4 p-3 rounded-xl bg-neutral-50 border">
                <div className="font-medium mb-2">Background</div>
                <div className="flex items-center gap-3">
                  <select className="border rounded px-2 py-1" value={bgMode} onChange={(e) => setBgMode(e.target.value)}>
                    <option value="checker">Checkerboard</option>
                    <option value="color">Solid Color</option>
                    <option value="transparent">Transparent</option>
                  </select>
                  {bgMode === 'color' && <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />}
                </div>
              </div>

              {/* Layers list */}
              <div className="space-y-3">
                <div className="text-base font-semibold">Layers</div>
                {items.map((it) => (
                  <div key={it.id} className={`p-3 rounded-xl border ${it.isSelected ? 'border-indigo-500' : 'border-neutral-200'}`}>
                    <div className="flex items-center justify-between mb-2 gap-2">
                      <div className="font-medium truncate" title={it.label || it.id}>
                        {it.label || it.id}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="text-xs px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200"
                          onClick={() => updateItem(it.id, { visible: !it.visible })}
                        >
                          {it.visible ? 'Hide' : 'Show'}
                        </button>
                        <button
                          className="text-xs px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200"
                          onClick={() => moveLayer(it.id, 'up')}
                        >
                          Up
                        </button>
                        <button
                          className="text-xs px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200"
                          onClick={() => moveLayer(it.id, 'down')}
                        >
                          Down
                        </button>
                        <button className="text-xs px-2 py-1 rounded bg-rose-100 hover:bg-rose-200" onClick={() => removeItem(it.id)}>
                          Remove
                        </button>
                        <button className="text-xs px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200" onClick={() => selectId(it.id)}>
                          Select
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                      <label>
                        {' '}
                        X
                        <input
                          type="number"
                          className="w-full border rounded px-1"
                          value={it.x}
                          onChange={(e) => updateItem(it.id, { x: +e.target.value })}
                        />
                      </label>
                      <label>
                        {' '}
                        Y
                        <input
                          type="number"
                          className="w-full border rounded px-1"
                          value={it.y}
                          onChange={(e) => updateItem(it.id, { y: +e.target.value })}
                        />
                      </label>
                      <label>
                        {' '}
                        Scale
                        <input
                          type="number"
                          step="0.01"
                          className="w-full border rounded px-1"
                          value={it.scale}
                          onChange={(e) => updateItem(it.id, { scale: Math.max(0.01, +e.target.value) })}
                        />
                      </label>
                      <label>
                        {' '}
                        Rotation
                        <input
                          type="number"
                          className="w-full border rounded px-1"
                          value={it.rotation}
                          onChange={(e) => updateItem(it.id, { rotation: +e.target.value })}
                        />
                      </label>
                      <label>
                        {' '}
                        Opacity
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={it.opacity}
                          onChange={(e) => updateItem(it.id, { opacity: +e.target.value })}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Export */}
              <div className="mt-4 p-3 rounded-xl bg-neutral-50 border flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={exportTransparent} onChange={(e) => setExportTransparent(e.target.checked)} />
                  Export with transparent background
                </label>
                <button onClick={handleExport} className="px-3 py-2 rounded-xl shadow bg-indigo-600 text-white hover:bg-indigo-700">
                  Export PNG
                </button>
              </div>
            </div>
          </aside>

          {/* Center viewport */}
          <main className="col-span-6 h-full flex items-center justify-center bg-neutral-25">
            <div
              className="relative border rounded-xl"
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
          </main>

          {/* Right pane (order / item info) */}
          <aside className="col-span-3 h-full overflow-y-auto border-l">
            <div className="p-4">
              <div className="text-lg font-semibold mb-3">{rightPaneTitle}</div>

              <InfoList data={itemInfo} />

              <div className="mt-6 flex gap-2 justify-end">
                <button className="px-3 py-2 rounded-xl border bg-neutral-50 hover:bg-neutral-100" onClick={onClose}>
                  Close
                </button>
                <button className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">Passed</button>
                <button className="px-3 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700">Reject</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

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

function Checkerboard({ w, h, size = 32 }) {
  const rects = [];
  for (let yy = 0; yy < h; yy += size) {
    for (let xx = 0; xx < w; xx += size) {
      const isDark = (xx / size + yy / size) % 2 === 0;
      rects.push(<Rect key={`${xx}-${yy}`} x={xx} y={yy} width={size} height={size} fill={isDark ? '#e5e7eb' : '#ffffff'} />);
    }
  }
  return <>{rects}</>;
}

function InfoList({ data = {} }) {
  const entries = Object.entries(data);
  if (!entries.length) {
    return <div className="text-sm text-neutral-500">No item info provided.</div>;
  }
  return (
    <div className="space-y-2 text-sm">
      {entries.map(([k, v]) => (
        <div key={k} className="flex gap-2">
          <div className="w-40 text-neutral-500">{toTitle(k)}:</div>
          <div className="flex-1 break-words">{String(v)}</div>
        </div>
      ))}
    </div>
  );
}

function toTitle(s) {
  return String(s)
    .replace(/[_.-]+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());
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
