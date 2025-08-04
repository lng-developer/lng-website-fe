import { useState } from 'react';
import { login } from '../../apis/auth';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { routes } from '../../routes/routes';

export default function Login() {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [errorUsername, setErrorUsername] = useState(false);
  const [errorPassword, setErrorPassword] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault(); // 👉 Ngăn reload trang

    if (userName === '') {
      setErrorUsername(true);
      return;
    }

    if (password === '') {
      setErrorPassword(true);
      return;
    }

    try {
      const result = await login(userName, password);
      if (result.status === 200) {
        loginUser(result.data);
        navigate(routes.order_amazon);
        toast.success(result.data?.message);
      } else {
        toast.error(result.data?.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message);
    }
  };

  return (
    <>
      <div className="mt-20 flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900">Login to your account</h2>
        </div>

        <div className={` sm:mx-auto sm:w-full sm:max-w-sm bg-white shadow-sm border-2 rounded-lg p-8`} style={{ borderColor: '#d3d9e1' }}>
          <div className="space-y-2">
            <div>
              <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900">
                Username
              </label>
              <div className="mt-2">
                <input
                  required
                  style={{ color: 'black' }}
                  onChange={(value) => {
                    setErrorUsername(false);
                    setUserName(value.target.value);
                  }}
                  autoComplete="email"
                  className="font-medium block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
              {errorUsername && (
                <div className="mt-2">
                  <span className="text-red-500 text-sm/6">Please enter username</span>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900">
                  Password
                </label>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  style={{ color: 'black' }}
                  onChange={(value) => {
                    setErrorPassword(false);
                    setPassword(value.target.value);
                  }}
                  required
                  autoComplete="current-password"
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-black sm:text-sm/6"
                />
              </div>
              {errorPassword && (
                <div className="mt-2">
                  <span className="text-red-500 text-sm/6">Please enter password</span>
                </div>
              )}
            </div>
            <div className="mt-6">
              <button
                type="submit"
                onClick={handleSubmit}
                className="!text-white flex w-full justify-center rounded-md bg-black px-3 py-1.5 text-sm/6 font-semibold shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
