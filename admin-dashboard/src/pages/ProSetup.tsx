// Page de configuration du compte professionnel (fallback web)
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { validateInvitationToken, setupProfessionalAccount } from '../services/api';

type PageState = 'loading' | 'error' | 'form' | 'success';

export default function ProSetup() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [pageState, setPageState] = useState<PageState>('loading');
  const [professional, setProfessional] = useState<{ firstName: string; lastName: string; email: string } | null>(null);
  const [error, setError] = useState('');

  const [pseudonyme, setPseudonyme] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Token manquant. Veuillez utiliser le lien reçu par email.');
      setPageState('error');
      return;
    }

    validateInvitationToken(token)
      .then((data) => {
        setProfessional(data.professional);
        setPageState('form');
      })
      .catch((err) => {
        const message = err.response?.data?.message || 'Token invalide ou expiré';
        setError(message);
        setPageState('error');
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (pseudonyme.trim().length < 2) {
      setFormError('Le pseudonyme doit contenir au moins 2 caractères');
      return;
    }

    if (password.length < 8) {
      setFormError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsSubmitting(true);

    try {
      await setupProfessionalAccount({ token: token!, password, pseudonyme: pseudonyme.trim() });
      setPageState('success');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Erreur lors de la création du compte');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validation du lien en cours...</p>
        </div>
      </div>
    );
  }

  if (pageState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-600">{error}</p>
          <p className="text-gray-500 mt-4 text-sm">
            Si vous avez besoin d'un nouveau lien, contactez votre administrateur.
          </p>
        </div>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="text-green-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Compte créé avec succès</h1>
          <p className="text-gray-600 mb-6">
            Votre mot de passe a été configuré. Vous pouvez maintenant vous connecter à l'application CleanHouse Pro.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <h2 className="font-medium text-gray-900 mb-2">Prochaines étapes :</h2>
            <ol className="list-decimal list-inside text-gray-600 space-y-2 text-sm">
              <li>Téléchargez l'application CleanHouse Pro sur votre téléphone</li>
              <li>Connectez-vous avec votre email et le mot de passe que vous venez de créer</li>
              <li>Complétez votre profil pour commencer à recevoir des missions</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">CleanHouse Pro</h1>
          <p className="text-gray-600 mt-2">Configuration de votre compte</p>
        </div>

        {professional && (
          <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <p className="text-teal-800">
              Bienvenue <span className="font-semibold">{professional.firstName} {professional.lastName}</span>
            </p>
            <p className="text-teal-600 text-sm mt-1">{professional.email}</p>
          </div>
        )}

        {formError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="pseudonyme" className="block text-sm font-medium text-gray-700">
              Pseudonyme
            </label>
            <input
              type="text"
              id="pseudonyme"
              value={pseudonyme}
              onChange={(e) => setPseudonyme(e.target.value)}
              required
              minLength={2}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder="Votre pseudonyme"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              placeholder="8 caractères minimum"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirmer le mot de passe
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
            {isSubmitting ? 'Création en cours...' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}
