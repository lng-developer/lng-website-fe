import { Button, Space, Tooltip, Upload, Spin } from 'antd';
import { UploadOutlined, DownloadOutlined, SolutionOutlined, PlayCircleOutlined, HourglassOutlined } from '@ant-design/icons';
import { toast } from 'sonner';
import { useState } from 'react';
import { dowloadPSD } from '../../apis/listing';
import ModalAssign from './ModalAssign';
import { qctPsd, requestPsd, startPsd, uploadPsd } from '../../apis/psdTask';
import { FcApproval } from 'react-icons/fc';
import { IoArrowUndo } from 'react-icons/io5';
import { dataColors } from '../../utils/dataColors';

const ItemActionPSD = ({ idTask, asin, fetchAllListing, filters, data, statusTask, fetchCountStatus }) => {
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
      formData.append('asin', asin);
      try {
        setUploading(true); // bật Spin ngay khi bắt đầu
        const res = await uploadPsd(idTask, formData, {
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
        fetchCountStatus();
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
      fetchCountStatus();
    }
  };

  const handleStart = async () => {
    try {
      const response = await startPsd(idTask);
      if (response.status === 200) {
        toast.success('Change status success!');
      }
    } catch (error) {
      console.log(error);
      toast.error('Error server!');
    } finally {
      fetchAllListing(filters);
      fetchCountStatus();
    }
  };

  const handlePassed = async () => {
    try {
      const response = await qctPsd(idTask, {
        result: 'pass',
        note: '',
      });
      if (response.status === 200) {
        toast.success('Change status success!');
      }
    } catch (error) {
      console.log(error);
      toast.error('Error server!');
    } finally {
      fetchAllListing(filters);
      fetchCountStatus();
    }
  };

  const handleReject = async () => {
    try {
      const response = await qctPsd(idTask, {
        result: 'reject',
        note: '',
      });
      if (response.status === 200) {
        toast.success('Change status success!');
      }
    } catch (error) {
      console.log(error);
      toast.error('Error server!');
    } finally {
      fetchAllListing(filters);
      fetchCountStatus();
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
          <Tooltip title="Request upload">
            <Button icon={<PlayCircleOutlined />} onClick={handleRequestPsd} />
          </Tooltip>
        )}

        {statusTask === 'Requested' && (
          <Tooltip title="Assign">
            <Button icon={<SolutionOutlined />} onClick={() => setIsShowModal(true)} />
          </Tooltip>
        )}

        {statusTask === 'Assigned' && (
          <Tooltip title="Start doing">
            <Button icon={<HourglassOutlined />} onClick={handleStart} />
          </Tooltip>
        )}

        {statusTask === 'Uploaded' && (
          <>
            <Tooltip title="Passed">
              <Button icon={<FcApproval />} onClick={handlePassed} />
            </Tooltip>
            <Tooltip title="Reject">
              <Button icon={<IoArrowUndo color={dataColors.cancelled} />} onClick={handleReject} />
            </Tooltip>
          </>
        )}
      </Space>

      <ModalAssign
        isShowModal={isShowModal}
        setIsShowModal={setIsShowModal}
        idTask={idTask}
        fetchAllListing={fetchAllListing}
        filters={filters}
        fetchCountStatus={fetchCountStatus}
      />
    </>
  );
};

export default ItemActionPSD;
