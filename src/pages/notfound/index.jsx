import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export const NotFound = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <section className="flex items-center h-full p-16 dark:bg-gray-900 dark:text-gray-100">
      <div className="container flex flex-col items-center justify-center px-5 mx-auto my-8">
        <div className="max-w-md text-center">
          <h2 className="mb-8 font-extrabold text-9xl dark:text-gray-600">
            <span className="sr-only">{t('error')}</span>404
          </h2>
          <p className="text-2xl font-semibold md:text-3xl">{t('error_notfound')}</p>
          <p className="mt-4 mb-8 dark:text-gray-400">{t('text_change_login')}</p>
          <button
            onClick={() => navigate(-1)}
            className="flex justify-center items-center w-full px-8 py-3 font-semibold rounded dark:bg-violet-400 dark:text-gray-900 bg-blue-600 !text-white"
          >
            {t('back_to')}
          </button>
        </div>
      </div>
    </section>
  );
};
