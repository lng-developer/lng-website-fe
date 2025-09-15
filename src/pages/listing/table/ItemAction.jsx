import { Button, Space, Tooltip, Upload } from 'antd';
import { UploadOutlined, DownloadOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { toast } from 'sonner';
import { useState } from 'react';
import { deleteListing, dowloadPSD, uploadPSD } from '../../../apis/listing';
import ModalDelete from '../../../components/ModalDelete';

const ItemAction = ({ id, asin, fetchAllListing, filters, isDelete = true, setOpenModalUpdate, data, setDataEdit }) => {
  const [fileList, setFileList] = useState([]);
  const [openModalDelete, setOpenModalDelete] = useState(false);

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
    try {
      const response = await deleteListing(id);
      if (response.status === 200) {
        toast.success('Delete success!');
      }
    } catch (error) {
      console.log(error);
      toast.error('Delete Failed!');
    } finally {
      fetchAllListing(filters);
    }
  };
  return (
    <>
      <Space size="small">
        <Tooltip title="Upload">
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />} />
          </Upload>
        </Tooltip>

        <Tooltip title="Download">
          <Button icon={<DownloadOutlined />} onClick={downloadPSD} />
        </Tooltip>

        {isDelete && (
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                setDataEdit(data);
                setOpenModalUpdate(true);
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
