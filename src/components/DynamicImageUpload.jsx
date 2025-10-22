// DynamicImageUploadBatch.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Upload, Button, Card, Modal, Select, Image, Spin } from 'antd';
import { DeleteOutlined, CloudUploadOutlined } from '@ant-design/icons';
import { IoCloudUploadOutline } from 'react-icons/io5';
import { v4 as uuid } from 'uuid';
import { toast } from 'sonner';
import { uploadScale } from '../apis/order';
import { MdAdd } from 'react-icons/md';
import LazyImage from './LazyImage';
const { Dragger } = Upload;

const IMAGE_TYPES = [
  { label: 'Front', value: 'front' },
  { label: 'Back', value: 'back' },
  { label: 'Left Sleeve', value: 'left_sleeve' },
  { label: 'Right Sleeve', value: 'right_sleeve' },
  { label: 'Collar', value: 'collar' },
];
const TITLE_BY_TYPE = {
  front: 'Front',
  back: 'Back',
  left_sleeve: 'Left Sleeve',
  right_sleeve: 'Right Sleeve',
  collar: 'Collar',
};

export default function DynamicImageUploadBatch({
  serverItems = [], // NEW: [{id, kind, url, title?}]
  maxSlots = 5,
  initialKinds = [], // ví dụ: ['front']
  disabled = false,
  orderId,
  orderItemId,
  fetchAllFulfill,
  filters,
}) {
  const [slots, setSlots] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [kind, setKind] = useState();
  const [spinning, setSpinning] = useState(false);

  // --- HYDRATE từ API + initialKinds
  useEffect(() => {
    // 1) từ serverItems
    const fromServer = (serverItems || []).map((it) => ({
      id: it.id ?? uuid(),
      kind: it.position,
      title: TITLE_BY_TYPE[it.position] || it.title || it.position,
      file: null,
      preview: it.url || '', // hiển thị ngay
    }));

    // 2) thêm initialKinds nếu chưa có
    const existKinds = new Set(fromServer.map((s) => s.kind));
    const fromInitial = (initialKinds || [])
      .filter((k) => !existKinds.has(k))
      .map((k) => ({
        id: uuid(),
        kind: k,
        title: TITLE_BY_TYPE[k],
        file: null,
        preview: '',
      }));

    setSlots([...fromServer, ...fromInitial].slice(0, maxSlots));
  }, [serverItems, initialKinds, maxSlots]);

  const usedKinds = new Set(slots.map((s) => s.kind));
  const selectableKinds = IMAGE_TYPES.filter((t) => !usedKinds.has(t.value));
  const canAdd = slots.length < maxSlots && selectableKinds.length > 0;

  const addSlot = () => {
    setKind(undefined);
    setAddOpen(true);
  };
  const confirmAdd = () => {
    if (!kind) return;
    setSlots((prev) => [...prev, { id: uuid(), kind, title: TITLE_BY_TYPE[kind], file: null, preview: '' }]);
    setAddOpen(false);
  };

  const removeSlot = async (slot) => {
    setSlots((prev) => prev.filter((s) => s.id !== slot.id));
  };

  // người dùng chọn file -> chỉ lưu local + preview, KHÔNG auto upload
  const handleBeforeUpload = (file, slot) => {
    const url = URL.createObjectURL(file);
    setSlots((prev) => prev.map((s) => (s.id === slot.id ? { ...s, file, preview: url } : s)));
    return Upload.LIST_IGNORE;
  };

  // Dữ liệu batch upload
  const itemsReady = useMemo(() => slots.filter((s) => !!s.file).map((s) => ({ position: s.kind, file: s.file })), [slots]);

  const uploadAll = async () => {
    if (!itemsReady) {
      toast.error('No images to upload!');
      return;
    }
    setSpinning(true);
    const formData = new FormData();
    itemsReady.forEach((f) => {
      formData.append('files', f.file);
    });
    const meta = itemsReady.map((f) => ({ position: f.position }));
    formData.append('meta', JSON.stringify(meta));
    try {
      const response = await uploadScale(orderId, orderItemId, formData);
      if (response.status === 200) {
        toast.success('Import success!');
      } else {
        toast.error('Import error');
      }
    } catch (error) {
      console.log(error);
      toast.error('Import error');
    } finally {
      fetchAllFulfill(filters);
      setSpinning(false);
    }
  };

  return (
    <div className="dyn-batch">
      <div className="flex mb-2 gap-2">
        <Button icon={<CloudUploadOutlined />} type="default" onClick={uploadAll} disabled={disabled || !itemsReady.length}>
          Upload
        </Button>
        <Button type="dashed" icon={<MdAdd />} onClick={addSlot} disabled={!canAdd || disabled}>
          Add
        </Button>
      </div>

      <div
        style={{
          width: slots.length > 1 ? 310 : 200,
          display: 'grid',
          gridTemplateColumns: slots.length > 1 ? '1fr 1fr' : '1fr',
          gap: '4px',
        }}
      >
        {slots.map((slot) => (
          <Card
            key={slot.id}
            size="small"
            title={slot.title}
            extra={<Button type="text" size="small" icon={<DeleteOutlined />} danger onClick={() => removeSlot(slot)} />}
            style={{ width: slots.length > 1 ? 150 : 200, borderColor: '#d9d9d9' }}
            styles={{
              header: {
                borderBottom: '1px solid #d9d9d9',
              },
              body: {
                padding: 10,
              },
            }}
          >
            <Dragger
              beforeUpload={(file) => handleBeforeUpload(file, slot)}
              showUploadList={false}
              accept="image/*"
              disabled={disabled}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {slot.preview ? (
                <div className="rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
                  <LazyImage width={slots.length > 1 ? 126 : 176} height={100} src={slot.preview} preview={true} />
                </div>
              ) : (
                <div
                  style={{
                    height: 100,
                    opacity: 0.85,
                    padding: 4,
                  }}
                  className="flex-col items-center justify-center"
                >
                  <div className="flex items-center justify-center mt-1">
                    <IoCloudUploadOutline size={35} />
                  </div>
                  <div>Click to upload or drag and drop.</div>
                </div>
              )}
            </Dragger>
          </Card>
        ))}
      </div>

      {spinning && <Spin fullscreen tip="Uploading photos..." />}

      {/* Modal chọn loại ảnh khi Add */}
      <Modal
        open={addOpen}
        title="Select image location"
        onCancel={() => setAddOpen(false)}
        onOk={confirmAdd}
        okButtonProps={{ disabled: !kind }}
        style={{ top: '30%' }}
        width={350}
      >
        <Select placeholder="Select image type" options={selectableKinds} value={kind} onChange={setKind} style={{ width: '100%' }} />
      </Modal>
    </div>
  );
}
