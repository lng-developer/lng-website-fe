import { Button, Space, Tooltip, Upload, Spin } from 'antd';
import { UploadOutlined, DownloadOutlined, SolutionOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { toast } from 'sonner';
import { useState } from 'react';
import { dowloadPSD, uploadPSD } from '../../apis/listing';
import ModalAssign from './ModalAssign';
import { requestPsd } from '../../apis/psdTask';

const ItemActionPSD = ({ idTask, asin, fetchAllListing, filters, data, statusTask }) => {
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false); // <-- Spin pending
  const [isShowModal, setIsShowModal] = useState(false);

  const uploadProps = {
    accept: '.psd',
    multiple: false,
    maxCount: 1,
    fileList,
    showUploadList: false, // không hiện danh sách file
    customRequest: async ({ file, onSuccess, onError, onProgress }) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        setUploading(true); // bật Spin ngay khi bắt đầu
        const res = await uploadPSD(asin, formData, {
          onUploadProgress: (evt) => {
            if (evt.total) {
              const percent = Math.round((evt.loaded / evt.total) * 100);
              onProgress?.({ percent });
            }
          },
        });

        onSuccess?.(res.data);
        toast.success(`${file.name} uploaded success!`);
        // Sau khi upload xong, refresh lại danh sách (đợi xong rồi mới tắt Spin)
        await fetchAllListing?.(filters);
      } catch (err) {
        console.error(err);
        onError?.(err);
        toast.error(`${file.name} upload failed!`);
      } finally {
        setUploading(false); // tắt Spin
        setFileList([]); // clear nếu cần
      }
    },
    onChange(info) {
      setFileList(info.fileList);
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
    } finally {
      toast.success('Download success!');
    }
  };

  const handleRequestPsd = async () => {
    try {
      const response = await requestPsd({
        taskId: idTask,
      });
      if (response.status === 200) {
        toast.success('Request success!');
      }
    } catch (error) {
      console.log(error);
    } finally {
      fetchAllListing(filters);
    }
  };

  return (
    <>
      <Space size="small" align="center">
        {/* Khi đang upload -> hiện Spin pending; ngược lại hiện nút Upload */}
        {uploading ? (
          <div style={{ width: 32, display: 'flex', justifyContent: 'center' }}>
            <Spin size="small" tip="Pending" />
          </div>
        ) : (
          <Tooltip title="Upload">
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />} />
            </Upload>
          </Tooltip>
        )}

        <Tooltip title="Download">
          <Button disabled={data?.psd?.status === 'Available' ? false : true} icon={<DownloadOutlined />} onClick={downloadPSD} />
        </Tooltip>

        {statusTask === 'New' && (
          <Tooltip title="Skip">
            <Button icon={<PlayCircleOutlined />} onClick={handleRequestPsd} />
          </Tooltip>
        )}

        {statusTask === 'Requested' && (
          <Tooltip title="Assign">
            <Button icon={<SolutionOutlined />} onClick={() => setIsShowModal(true)} />
          </Tooltip>
        )}
      </Space>

      <ModalAssign
        isShowModal={isShowModal}
        setIsShowModal={setIsShowModal}
        idTask={idTask}
        fetchAllListing={fetchAllListing}
        filters={filters}
      />
    </>
  );
};

export default ItemActionPSD;
