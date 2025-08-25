import React, { useState } from 'react';
import { Upload, Button, Image, Tooltip, Flex } from 'antd';
import { UploadOutlined, DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import { toast } from 'sonner';
import { IoClose } from 'react-icons/io5';
import { uploadScale } from '../../../apis/order';

const { Dragger } = Upload;

export default function SubItemAction({ filters, fetchAllFulfill, orderId, orderItemId, fulfillment_file, scale_status }) {
  const [imageList, setImageList] = useState(null);
  const [fileList, setFileList] = useState([]);

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  };

  const uploadProps = {
    name: 'imageList',
    multiple: false,
    maxCount: 1,
    accept: 'image/*',
    fileList,
    beforeUpload: async (imageList) => {
      const preview = await getBase64(imageList);
      setImageList({
        uid: imageList.uid,
        name: imageList.name,
        originFileObj: imageList,
        thumbUrl: preview,
      });
      setFileList([{ uid: imageList.uid, name: imageList.name, status: 'done' }]);
      return false; // không upload tự động
    },
  };

  const handleUpload = async () => {
    if (!imageList) {
      toast.error('No images to upload!');
      return;
    }
    const formData = new FormData();
    formData.append('file', imageList?.originFileObj);
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
    }
  };

  function ensureAttachment(url, filename) {
    const u = new URL(url);
    // Cloudinary: fl_attachment (tùy chọn đặt tên)
    if (!u.searchParams.has('fl_attachment')) {
      u.searchParams.set('fl_attachment', filename || '');
    }
    return u.toString();
  }

  function guessName(url, fallback = 'design.psd') {
    try {
      const u = new URL(url);
      const fromPath = u.pathname.split('/').pop();
      const fromParam = u.searchParams.get('fl_attachment');
      const name = fromParam || fromPath || fallback;
      return name.endsWith('.psd') ? name : `${name}.psd`;
    } catch {
      return fallback;
    }
  }

  const handleDownload = async (e) => {
    e?.stopPropagation?.();
    if (!fulfillment_file) {
      toast.error('No images to download!');
      return;
    }

    const dlUrl = ensureAttachment(fulfillment_file, `${orderId}.psd`);
    const saveAs = guessName(dlUrl, `${orderId}.psd`);

    try {
      // 1) fetch -> blob -> ObjectURL (không điều hướng tab)
      const res = await fetch(dlUrl, { mode: 'cors' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();

      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = saveAs; // ép save với tên file
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.log(err);
      // 2) Fallback: mở tab mới (không đè tab hiện tại)
      window.open(dlUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRemove = () => {
    setImageList(null);
    setFileList([]);
  };

  return (
    <div style={{ width: 150, margin: '0 auto' }}>
      {/* Action Buttons */}
      <div style={{ display: 'flex', marginBottom: '16px', gap: 20 }}>
        <Tooltip title="Upload">
          <Button type="default" icon={<UploadOutlined />} onClick={handleUpload} style={{ flex: 1, height: '35px' }}></Button>
        </Tooltip>
        <Tooltip title="Download">
          <Button type="default" icon={<DownloadOutlined />} onClick={handleDownload} style={{ flex: 1, height: '35px' }}></Button>
        </Tooltip>
      </div>

      {/* Drag & Drop Area */}
      <Dragger {...uploadProps} disabled={!!imageList || !!fulfillment_file}>
        <div
          style={{
            width: '100%',
            height: 100, // cố định chiều cao khung
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {imageList || fulfillment_file ? (
            <div style={{ width: '100%', height: '100%' }} onClick={(e) => e.stopPropagation()}>
              <Image
                src={imageList?.thumbUrl || fulfillment_file}
                alt={imageList?.name}
                style={{
                  width: 120,
                  height: 100,
                  objectFit: 'cover',
                }}
                className="rounded-lg"
              />
            </div>
          ) : (
            <div>
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: 30, color: '#bfbfbf' }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 14, fontWeight: 500, color: '#8c8c8c' }}>
                NO IMAGES
              </p>
            </div>
          )}

          {imageList && (
            <Button
              size="small"
              type="text"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              style={{
                position: 'absolute',
                top: -10,
                right: -10,
                background: 'rgba(0,0,0,0.55)',
                color: '#fff',
                height: 24,
                lineHeight: '20px',
                borderRadius: 25,
              }}
            >
              <IoClose size={10} />
            </Button>
          )}
        </div>
      </Dragger>
    </div>
  );
}
