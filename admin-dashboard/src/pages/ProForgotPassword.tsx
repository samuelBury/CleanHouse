// Page de demande de réinitialisation de mot de passe professionnel
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { requestPasswordReset } from '../services/api';
import { getProPageTranslation } from '../i18n/proPages';

export default function ProForgotPassword() {
  const [searchParams] = useSearchParams();
  const lang = searchParams.get('lang') || 'fr';
  const t = getProPageTranslation(lang);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || t.genericError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100" dir={dir}>
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="text-green-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t.emailSent}</h1>
          <p className="text-gray-600">{t.emailSentDesc(email)}</p>
          <p className="text-gray-500 mt-4 text-sm">{t.checkSpam}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100" dir={dir}>
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t.forgotTitle}</h1>
          <p className="text-gray-600 mt-2">{t.forgotSubtitle}</p>
        </div>

        <p className="text-gray-600 text-sm mb-6">{t.forgotDesc}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {t.emailLabel}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder={t.emailPlaceholder}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
          >
            {isSubmitting ? t.sending : t.sendLink}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <a href="/login" className="text-teal-600 hover:text-teal-500">
            {t.backToLogin}
          </a>
        </p>
      </div>
    </div>
  );
}
