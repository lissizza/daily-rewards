import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useLanguageStore } from '@/stores/language';
import { useTranslation } from '@/i18n/useTranslation';
import { validatePassword, PASSWORD_MIN_LENGTH } from '@/lib/validation';

export function LoginPage() {
  const [emailOrLogin, setEmailOrLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { signIn, signUp, user } = useAuthStore();
  const { language, setLanguage } = useLanguageStore();
  const navigate = useNavigate();
  const t = useTranslation();

  // Navigate when user is authenticated (after onAuthStateChange updates state)
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password on signup
    if (isSignUp) {
      const validation = validatePassword(password);
      if (!validation.valid) {
        setError(validation.error || 'Invalid password');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (isSignUp) {
        await signUp(emailOrLogin, password, name);
      } else {
        await signIn(emailOrLogin, password);
      }
      // Navigation will happen via useEffect when user state updates
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSubmitting(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ru' ? 'en' : 'ru');
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4">
      {/* Language toggle */}
      <button
        type="button"
        onClick={toggleLanguage}
        className="absolute right-4 top-4 flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
      >
        <Globe className="h-4 w-4" />
        {language === 'ru' ? 'EN' : 'RU'}
      </button>

      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center text-center">
          <img
            src="/pwa-192x192.png"
            alt="Daily Rewards"
            className="mb-4 h-24 w-24"
          />
          <h1 className="text-2xl font-bold">{t.login.title}</h1>
          <p className="text-muted-foreground">
            {isSignUp ? t.login.signUp : t.login.signIn}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                {t.login.name}
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                required={isSignUp}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              {isSignUp ? t.login.email : t.login.emailOrLogin}
            </label>
            <input
              id="email"
              type={isSignUp ? 'email' : 'text'}
              value={emailOrLogin}
              onChange={(e) => setEmailOrLogin(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              {t.login.password}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
              required
              minLength={PASSWORD_MIN_LENGTH}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? t.login.loading : isSignUp ? t.login.signUpButton : t.login.signInButton}
          </button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {isSignUp ? t.login.hasAccount : t.login.noAccount}
          </button>
        </div>
      </div>
    </div>
  );
}
