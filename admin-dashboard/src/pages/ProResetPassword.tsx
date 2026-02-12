// Page de réinitialisation du mot de passe professionnel
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { resetProPassword } from '../services/api';
import { getProPageTranslation } from '../i18n/proPages';

type PageState = 'form' | 'success' | 'error';

export default function ProResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const lang = searchParams.get('lang') || 'fr';
  const t = getProPageTranslation(lang);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageState, setPageState] = useState<PageState>(token ? 'form' : 'error');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (password.length < 8) {
      setFormError(t.passwordMinLength);
      return;
    }

    if (password !== confirmPassword) {
      setFormError(t.passwordMismatch);
      return;
    }

    setIsSubmitting(true);

    try {
      await resetProPassword(token!, password);
      setPageState('success');
    } catch (err: any) {
      setFormError(err.response?.data?.message || t.resetError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100" dir={dir}>
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t.invalidLink}</h1>
          <p className="text-gray-600">{t.tokenMissing}</p>
          <p className="mt-4">
            <a href={`/pro/forgot-password?lang=${lang}`} className="text-teal-600 hover:text-teal-500 text-sm">
              {t.requestNewLink}
            </a>
          </p>
        </div>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100" dir={dir}>
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="text-green-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t.resetSuccess}</h1>
          <p className="text-gray-600 mb-6">{t.resetSuccessDesc}</p>
          <div className="bg-gray-50 rounded-lg p-4 text-left" dir={dir}>
            <h2 className="font-medium text-gray-900 mb-2">{t.nextSteps}</h2>
            <ol className="list-decimal list-inside text-gray-600 space-y-2 text-sm">
              <li>{t.resetStep1}</li>
              <li>{t.resetStep2}</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100" dir={dir}>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t.resetTitle}</h1>
          <p className="text-gray-600 mt-2">{t.resetSubtitle}</p>
        </div>

        {formError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              {t.newPassword}
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder={t.passwordPlaceholder}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              {t.confirmPassword}
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
          >
            {isSubmitting ? t.resetting : t.resetButton}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <a href={`/pro/forgot-password?lang=${lang}`} className="text-teal-600 hover:text-teal-500">
            {t.requestNewLink}
          </a>
        </p>
      </div>
    </div>
  );
}
