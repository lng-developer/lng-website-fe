import { Button, Space, Tooltip, Upload, Spin } from 'antd';
import { UploadOutlined, DownloadOutlined, SolutionOutlined, PlayCircleOutlined, HourglassOutlined } from '@ant-design/icons';
import { toast } from 'sonner';
import { useState } from 'react';
import { dowloadPSD } from '../../apis/listing';
import { approveIdeaTask, rejectIdeaTask, startIdeaPsd, uploadIdaeTask } from '../../apis/psdTask';
import { FcApproval } from 'react-icons/fc';
import { IoArrowUndo } from 'react-icons/io5';
import { dataColors } from '../../utils/dataColors';
import ModalAssignIdea from './ModalAssignIdea';

const ItemActionIdeaTask = ({ idTask, asin, fetchAllListing, filters, statusTask, fetchCountStatus, user }) => {
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
        const res = await uploadIdaeTask(idTask, formData, {
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

  const handleStart = async () => {
    try {
      const response = await startIdeaPsd(idTask);
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
      const response = await approveIdeaTask(idTask);
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
      const response = await rejectIdeaTask(idTask);
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
          <Button
            disabled={statusTask === 'Uploaded' || statusTask === 'QC Passed' ? false : true}
            icon={<DownloadOutlined />}
            onClick={downloadPSD}
          />
        </Tooltip>

        {statusTask === 'New' && (
          <Tooltip title="Assign Designer">
            <Button icon={<SolutionOutlined />} onClick={() => setIsShowModal(true)} />
          </Tooltip>
        )}

        {statusTask === 'Assigned' && (
          <Tooltip title="Start doing">
            <Button icon={<HourglassOutlined />} onClick={handleStart} />
          </Tooltip>
        )}

        {(user?.role === 'Admin' || user?.role === 'Seller') && statusTask === 'Uploaded' && (
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

      <ModalAssignIdea
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

export default ItemActionIdeaTask;
