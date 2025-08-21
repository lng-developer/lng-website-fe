import { Image } from 'antd';
import { MdWarning, MdHome, MdArrowBack } from 'react-icons/md';
import { Navigate, useOutletContext } from 'react-router-dom';

export default function UnauthorizedPage() {
  const { collapsed } = useOutletContext();
  const handleGoBack = () => {
    // Trong ứng dụng thực tế, có thể sử dụng history.back()
    Navigate(-1);
  };

  return (
    <div className={`fixed top-0 ${collapsed ? 'left-64' : 'left-13.5'} right-0 z-50 bg-white transition-all duration-300`}>
      <div className=" flex justify-center items-center">
        <div className="max-w-md w-full mt-20">
          {/* Icon và animation */}
          <div className="text-center mb-8">
            <Image
              preview={false}
              src="https://res.cloudinary.com/debr5x898/image/upload/v1755767667/lmao_lmao_r8nd5i.png"
              className="mb-4"
            />

            {/* Mã lỗi */}
            {/* <div className="text-6xl font-bold text-red-600 mb-2 animate-bounce">401</div> */}

            {/* Tiêu đề chính */}
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Vào đây làm gì hả em?</h1>

            {/* Mô tả */}
            {/* <p className="text-gray-600 mb-8 leading-relaxed">
              Bạn không có quyền truy cập vào trang này. Vui lòng kiểm tra lại thông tin đăng nhập hoặc liên hệ quản trị viên.
            </p> */}
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGoBack}
              className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-300 transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-md"
            >
              <MdArrowBack className="w-5 h-5" />
              Quay lại
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
