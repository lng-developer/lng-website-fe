import { Button, Space, Tooltip } from 'antd';
import { UploadOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';

const ItemAction = ({
  onUpload,
  onDownload,
  onDelete,
  uploadTooltip = 'Upload',
  downloadTooltip = 'Download',
  deleteTooltip = 'Delete',
  size = 'middle',
  disabled = false,
}) => {
  return (
    <Space size="small">
      <Tooltip title={uploadTooltip}>
        <Button icon={<UploadOutlined />} onClick={onUpload} size={size} disabled={disabled} />
      </Tooltip>

      <Tooltip title={downloadTooltip}>
        <Button icon={<DownloadOutlined />} onClick={onDownload} size={size} disabled={disabled} />
      </Tooltip>

      <Tooltip title={deleteTooltip}>
        <Button icon={<DeleteOutlined />} onClick={onDelete} size={size} disabled={disabled} danger />
      </Tooltip>
    </Space>
  );
};

export default ItemAction;
