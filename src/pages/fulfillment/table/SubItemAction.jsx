import React, { useState } from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined, DownloadOutlined, InboxOutlined } from '@ant-design/icons';

const { Dragger } = Upload;

export default function SubItemAction() {
  const [imageList, setImageList] = useState([]);

  const uploadProps = {
    name: 'file',
    multiple: true,
    accept: 'image/*',
    fileList: imageList,
    beforeUpload: () => false, // Prevent auto upload
    onChange: (info) => {
      setImageList(info.fileList);
    },
    onDrop: (e) => {
      console.log('Dropped files', e.dataTransfer.files);
    },
    showUploadList: {
      showPreviewIcon: true,
      showRemoveIcon: true,
    },
    listType: 'picture',
  };

  const handleUpload = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.click();

    fileInput.onchange = (e) => {
      const files = Array.from(e.target.files);
      const newFileList = files.map((file, index) => ({
        uid: Date.now() + index,
        name: file.name,
        status: 'done',
        originFileObj: file,
        url: URL.createObjectURL(file),
      }));
      setImageList((prev) => [...prev, ...newFileList]);
    };
  };

  const handleDownload = () => {
    message.info('Download functionality');
  };

  return (
    <div style={{ width: 150, margin: '0 auto', padding: '16px' }}>
      {/* Action Buttons */}
      <div style={{ display: 'flex', marginBottom: '16px', gap: 10 }}>
        <Button type="default" icon={<UploadOutlined />} onClick={handleUpload} style={{ flex: 1, height: '25px' }}></Button>
        <Button type="default" icon={<DownloadOutlined />} onClick={handleDownload} style={{ flex: 1, height: '25px' }}></Button>
      </div>

      {/* Drag & Drop Area */}
      <Dragger {...uploadProps} style={{ marginBottom: '16px' }}>
        <div style={{ padding: ' 0', height: 60 }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: '24px', color: '#bfbfbf' }} />
          </p>
          <p className="ant-upload-text" style={{ fontSize: '14px', fontWeight: '500', color: '#8c8c8c' }}>
            {imageList.length === 0 ? 'NO IMAGES' : 'Drop images here'}
          </p>
        </div>
      </Dragger>
    </div>
  );
}
