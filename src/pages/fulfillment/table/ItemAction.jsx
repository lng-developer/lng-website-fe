import React from 'react';
import { Button, Tooltip } from 'antd';
import { UploadOutlined, CopyOutlined, DownloadOutlined, ScissorOutlined } from '@ant-design/icons';

export default function ItemAction() {
  const handleUpload = () => {
    console.log('Upload clicked');
  };

  const handleCopy = () => {
    console.log('Copy clicked');
  };

  const handleDownload = () => {
    console.log('Download clicked');
  };

  const handleCut = () => {
    console.log('Cut clicked');
  };

  return (
    <div className="flex gap-2">
      <Tooltip title="Upload">
        <Button
          type="text"
          icon={<UploadOutlined />}
          onClick={handleUpload}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
          }}
        />
      </Tooltip>

      <Tooltip title="Copy">
        <Button
          type="text"
          icon={<CopyOutlined />}
          onClick={handleCopy}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
          }}
        />
      </Tooltip>

      <Tooltip title="Download">
        <Button
          type="text"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
          }}
        />
      </Tooltip>

      <Tooltip title="Cut">
        <Button
          type="text"
          icon={<ScissorOutlined />}
          onClick={handleCut}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
          }}
        />
      </Tooltip>
    </div>
  );
}
