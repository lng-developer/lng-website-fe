import { Button, Space, Tooltip, Upload, Spin } from 'antd';
import { UploadOutlined, DownloadOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { toast } from 'sonner';
import { useState } from 'react';
import { deleteListing, dowloadPSD, uploadPSD } from '../../../apis/listing';
import ModalDelete from '../../../components/ModalDelete';

const ItemAction = ({ id, asin, fetchAllListing, filters, isDelete = true, setOpenModalUpdate, data, setDataEdit }) => {
  const [fileList, setFileList] = useState([]);
  const [openModalDelete, setOpenModalDelete] = useState(false);
  const [uploading, setUploading] = useState(false); // <-- Spin pending

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

  const handleDelete = async () => {
    try {
      const response = await deleteListing(id);
      if (response.status === 200) toast.success('Delete success!');
    } catch (error) {
      console.log(error);
      toast.error('Delete Failed!');
    } finally {
      await fetchAllListing?.(filters);
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

        {isDelete && (
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setDataEdit?.(data);
                setOpenModalUpdate?.(true);
              }}
            />
          </Tooltip>
        )}

        {isDelete && (
          <Tooltip title="Delete">
            <Button icon={<DeleteOutlined />} onClick={() => setOpenModalDelete(true)} danger />
          </Tooltip>
        )}
      </Space>

      <ModalDelete
        title="Delete asin"
        isShowModalDelete={openModalDelete}
        setIsShowModalDelete={setOpenModalDelete}
        handleDelete={handleDelete}
        text={'asin'}
      />
    </>
  );
};

export default ItemAction;
