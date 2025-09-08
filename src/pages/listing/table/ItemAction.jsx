import { Button, Space, Tooltip, Upload } from 'antd';
import { UploadOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import { toast } from 'sonner';
import { useState } from 'react';
import { dowloadPSD, uploadPSD } from '../../../apis/listing';

const ItemAction = ({ asin, fetchAllListing, filters }) => {
  const [fileList, setFileList] = useState([]);

  const uploadProps = {
    accept: '.psd',
    multiple: false,
    maxCount: 1,
    fileList,
    // không cần action nữa, dùng customRequest
    customRequest: async ({ file, onSuccess, onError, onProgress }) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await uploadPSD(asin, formData, {
          onUploadProgress: (evt) => {
            if (evt.total) {
              const percent = Math.round((evt.loaded / evt.total) * 100);
              onProgress?.({ percent });
            }
          },
        });
        onSuccess?.(res.data); // báo thành công để antd cập nhật UI
        toast.success(`${file.name} uploaded success!`);
      } catch (err) {
        console.error(err);
        onError?.(err);
        toast.error(`${file.name} upload failed!`);
      } finally {
        fetchAllListing(filters);
      }
    },
    onChange(info) {
      setFileList(info.fileList);
    },
    beforeUpload: (file) => {
      const isPSD = file.name.endsWith('.psd');
      if (!isPSD) {
        toast.error('Chỉ cho phép file PSD (.psd)');
        return Upload.LIST_IGNORE;
      }
    },
  };

  const downloadPSD = async () => {
    try {
      const response = await dowloadPSD(asin);
      if (response.status === 200) {
        const { signed_url, asin } = response.data || {};

        if (signed_url) {
          const link = document.createElement('a');
          link.href = signed_url;
          link.setAttribute('download', asin);
          link.setAttribute('target', '_parent');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.log(error);
      toast.error('Download Failed!');
    }
  };

  const handleDelete = async () => {
    // try {
    // } catch (error) {
    //   console.log(error);
    //   toast.error('Download Failed!');
    // }
  };
  return (
    <Space size="small">
      <Tooltip title="Upload">
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />} />
        </Upload>
      </Tooltip>

      <Tooltip title="Download">
        <Button icon={<DownloadOutlined />} onClick={downloadPSD} />
      </Tooltip>

      <Tooltip title="Delete">
        <Button icon={<DeleteOutlined />} onClick={handleDelete} danger />
      </Tooltip>
    </Space>
  );
};

export default ItemAction;
