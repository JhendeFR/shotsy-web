'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Flame,
  Sparkles,
  Lock,
  RotateCw,
  Shuffle,
  Crown,
  Wine,
  Sun,
  Moon,
  Users,
  Plus,
  Lightbulb,
  Check,
  LogIn,
  LogOut,
  Play,
} from 'lucide-react';
import { supabase, Category, Challenge, UserProfile } from '@/lib/supabase';
import { INITIAL_CATEGORIES, ALL_CHALLENGES } from '@/lib/challenges-data';
import styles from './page.module.css';

// SVG Nativos de Redes Sociales (Web Artifacts Builder)
function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function GoogleLogoSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const DEFAULT_PARTICIPANTS: string[] = [];

const WHEEL_PENALTIES = [
  'Tomas 1 Shot',
  'Verdad o 2 Tragos',
  'Elige quién bebe',
  'Todos toman 1 trago',
  'Te salvas esta ronda',
  'Fondo Blanco / 3 Tragos',
];

const WHEEL_PALETTE = ['#ff007f', '#8a2be2', '#00f2fe', '#ff0844', '#ffb703', '#10b981'];

export default function HomePage() {
  // Estado de Tema: Modo Claro / Modo Oscuro
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Navegación de pestañas (Mazo de Retos / Ruleta de Shots)
  const [activeTab, setActiveTab] = useState<'cartas' | 'ruleta'>('cartas');

  // Categorías y Retos
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [allChallenges, setAllChallenges] = useState<Challenge[]>(ALL_CHALLENGES);
  const [selectedCategory, setSelectedCategory] = useState<Category>(INITIAL_CATEGORIES[0]);

  // Mazos barajados en sesión para NO repetir retos
  const [decks, setDecks] = useState<Record<number, Challenge[]>>({});
  const [currentChallenge, setCurrentChallenge] = useState<Challenge>(ALL_CHALLENGES[0]);
  const [cardTransitionKey, setCardTransitionKey] = useState<number>(0);

  // Participantes de la Ruleta (Inicia vacío como solicitó el usuario)
  const [participants, setParticipants] = useState<string[]>(DEFAULT_PARTICIPANTS);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [isWheelReady, setIsWheelReady] = useState<boolean>(false);

  // Estado de Giro de la Ruleta
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelResult, setWheelResult] = useState<string>('Gira la ruleta para iniciar la ronda');

  // Autenticación de Supabase
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authReason, setAuthReason] = useState<'vip' | 'suggest' | 'general'>('general');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  // Modales
  const [showVipModal, setShowVipModal] = useState<boolean>(false);
  const [showSuggestModal, setShowSuggestModal] = useState<boolean>(false);
  const [suggestCount, setSuggestCount] = useState<number>(0);
  const [suggestSuccess, setSuggestSuccess] = useState<boolean>(false);
  const [suggestForm, setSuggestForm] = useState({
    categoryId: 1,
    content: '',
    drinks: 2,
  });

  // 1. Inicialización de Tema y usuario
  useEffect(() => {
    const savedTheme = (localStorage.getItem('shotsy_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const savedSuggestCount = parseInt(localStorage.getItem('shotsy_suggest_count') || '0', 10);
    setSuggestCount(savedSuggestCount);

    // Obtener sesión actual de Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email });
        fetchUserProfile(session.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({ id: session.user.id, email: session.user.email });
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (data) {
        setUserProfile(data);
      }
    } catch {
      // Perfil local
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('shotsy_theme', nextTheme);
  };

  // 2. Conexión resiliente a Supabase
  useEffect(() => {
    let isMounted = true;
    async function fetchGameData() {
      try {
        const { data: catData } = await supabase
          .from('categories')
          .select('*')
          .order('id', { ascending: true });

        const { data: chalData } = await supabase
          .from('challenges')
          .select('*')
          .eq('active', true);

        if (isMounted) {
          if (catData && catData.length >= 4) {
            setCategories(catData);
          }
          if (chalData && chalData.length >= 50) {
            setAllChallenges(chalData);
          } else if (chalData && chalData.length > 0) {
            const merged = [...ALL_CHALLENGES];
            chalData.forEach((rem) => {
              if (!merged.some((c) => c.content === rem.content)) {
                merged.push(rem);
              }
            });
            setAllChallenges(merged);
          }
        }
      } catch {
        // En caso de fallo de red, mantiene ALL_CHALLENGES intacto
      }
    }
    fetchGameData();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Inicializar mazos barajados por categoría para NO REPETIR en sesión
  const getNextCardFromDeck = useCallback(
    (categoryId: number, currentDeckList: Record<number, Challenge[]>) => {
      let activeDeck = currentDeckList[categoryId];
      const categoryChallenges = allChallenges.filter((c) => c.category_id === categoryId);

      if (!activeDeck || activeDeck.length === 0) {
        activeDeck = shuffleArray(categoryChallenges);
      }

      const nextCard = activeDeck[0] || categoryChallenges[0];
      const remainingDeck = activeDeck.slice(1);

      return {
        card: nextCard,
        updatedDeck: remainingDeck,
      };
    },
    [allChallenges]
  );

  // Inicializar la primera carta
  useEffect(() => {
    if (allChallenges.length > 0) {
      const { card, updatedDeck } = getNextCardFromDeck(selectedCategory.id, decks);
      setCurrentChallenge(card);
      setDecks((prev) => ({ ...prev, [selectedCategory.id]: updatedDeck }));
    }
  }, [selectedCategory.id]);

  // Selección de categoría
  const handleSelectCategory = (cat: Category) => {
    const isVip = userProfile?.is_vip || localStorage.getItem('shotsy_is_vip') === 'true';
    if (cat.is_vip && !isVip) {
      if (!currentUser) {
        setAuthReason('vip');
        setShowAuthModal(true);
      } else {
        setShowVipModal(true);
      }
      return;
    }
    setSelectedCategory(cat);
    const { card, updatedDeck } = getNextCardFromDeck(cat.id, decks);
    setCurrentChallenge(card);
    setDecks((prev) => ({ ...prev, [cat.id]: updatedDeck }));
    setCardTransitionKey((prev) => prev + 1);
  };

  // Siguiente carta sin repetir
  const handleNextCard = () => {
    const { card, updatedDeck } = getNextCardFromDeck(selectedCategory.id, decks);
    setCurrentChallenge(card);
    setDecks((prev) => ({ ...prev, [selectedCategory.id]: updatedDeck }));
    setCardTransitionKey((prev) => prev + 1);
  };

  // 4. Gestión de Participantes en la Ruleta
  const handleAddPlayer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = newPlayerName.trim();
    if (!cleanName) return;
    if (participants.includes(cleanName)) {
      setNewPlayerName('');
      return;
    }
    setParticipants([...participants, cleanName]);
    setNewPlayerName('');
  };

  const handleRemovePlayer = (nameToRemove: string) => {
    setParticipants(participants.filter((p) => p !== nameToRemove));
  };

  // Conic gradient dinámico para la ruleta
  const wheelBackground = useMemo(() => {
    const count = participants.length;
    if (count === 0) return 'conic-gradient(#ff007f 0deg 360deg)';
    const sliceAngle = 360 / count;
    const gradientStops = participants.map((_, idx) => {
      const color = WHEEL_PALETTE[idx % WHEEL_PALETTE.length];
      const start = idx * sliceAngle;
      const end = (idx + 1) * sliceAngle;
      return `${color} ${start}deg ${end}deg`;
    });
    return `conic-gradient(${gradientStops.join(', ')})`;
  }, [participants]);

  // Girar la Ruleta
  const handleSpinWheel = () => {
    if (isSpinning || participants.length < 2) return;
    setIsSpinning(true);
    setWheelResult('Girando la ruleta...');

    const extraSpins = 5 * 360;
    const randomAngle = Math.floor(Math.random() * 360);
    const newRotation = wheelRotation + extraSpins + randomAngle;
    setWheelRotation(newRotation);

    setTimeout(() => {
      const normalizedAngle = (360 - (newRotation % 360)) % 360;
      const sliceAngle = 360 / participants.length;
      const winnerIndex = Math.floor(normalizedAngle / sliceAngle) % participants.length;
      const winner = participants[winnerIndex] || participants[0];

      const penaltyIndex = Math.floor(Math.random() * WHEEL_PENALTIES.length);
      const chosenPenalty = WHEEL_PENALTIES[penaltyIndex];

      setWheelResult(`¡Le toca a ${winner}! 👉 ${chosenPenalty}`);
      setIsSpinning(false);

      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.7 },
        colors: ['#ff007f', '#00f2fe', '#8a2be2', '#ffb703'],
      });
    }, 3600);
  };

  // 5. Manejo de Login y Registro
  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al conectar con Google';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    try {
      if (authMode === 'login') {
        const { error, data } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        if (data.user) {
          setCurrentUser({ id: data.user.id, email: data.user.email });
          fetchUserProfile(data.user.id);
          setShowAuthModal(false);
          if (authReason === 'vip') setShowVipModal(true);
          if (authReason === 'suggest') setShowSuggestModal(true);
        }
      } else {
        const { error, data } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        if (data.user) {
          setCurrentUser({ id: data.user.id, email: data.user.email });
          setShowAuthModal(false);
          alert('¡Cuenta creada exitosamente!');
          if (authReason === 'vip') setShowVipModal(true);
          if (authReason === 'suggest') setShowSuggestModal(true);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error en la autenticación';
      setAuthError(message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUserProfile(null);
    localStorage.removeItem('shotsy_is_vip');
  };

  const handleOpenSuggestModal = () => {
    if (!currentUser) {
      setAuthReason('suggest');
      setShowAuthModal(true);
      return;
    }
    setShowSuggestModal(true);
  };

  const handleOpenVipModal = () => {
    if (!currentUser) {
      setAuthReason('vip');
      setShowAuthModal(true);
      return;
    }
    setShowVipModal(true);
  };

  const handleSendSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestForm.content.trim()) return;

    const isVip = userProfile?.is_vip || localStorage.getItem('shotsy_is_vip') === 'true';

    if (!isVip && suggestCount >= 5) {
      alert('Has alcanzado el límite de 5 sugerencias gratuitas. ¡Activa el Pase VIP para enviar sugerencias ilimitadas!');
      return;
    }

    try {
      await supabase.from('challenge_suggestions').insert([
        {
          user_id: currentUser?.id,
          user_email: currentUser?.email,
          category_id: suggestForm.categoryId,
          content: suggestForm.content,
          drinks_penalty: suggestForm.drinks,
          status: 'pending',
        },
      ]);
    } catch {
      // Resiliencia local
    }

    const nextCount = suggestCount + 1;
    setSuggestCount(nextCount);
    localStorage.setItem('shotsy_suggest_count', nextCount.toString());

    setSuggestSuccess(true);
    setTimeout(() => {
      setSuggestSuccess(false);
      setSuggestForm({ ...suggestForm, content: '' });
      setShowSuggestModal(false);
    }, 2000);
  };

  const isVip = Boolean(userProfile?.is_vip || (typeof window !== 'undefined' && localStorage.getItem('shotsy_is_vip') === 'true'));

  // Accesibilidad: Tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowVipModal(false);
        setShowSuggestModal(false);
        setShowAuthModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Microdatos JSON-LD con precio actualizado de $0.99 USD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Shotsy',
    url: 'https://shotsy-web.vercel.app',
    applicationCategory: 'GameApplication',
    operatingSystem: 'All',
    description:
      'Web app de ruleta y retos para previas con amigos, Yo Nunca y Verdad o Reto directo desde el navegador móvil.',
    offers: {
      '@type': 'Offer',
      price: '0.99',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      {/* FONDO ANIMADO DE LUCES DE DISCOTECA VIVAS (Taste & Transitions) */}
      <div className={styles.backgroundRoot} aria-hidden="true">
        <div className={styles.ambientMesh} />
        <div className={styles.discoBeam1} />
        <div className={styles.discoBeam2} />
        <div className={styles.discoBeam3} />
        <div className={styles.discoBeam4} />
        <div className={styles.discoProtector} />
      </div>

      <div className={styles.container}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* HEADER CON CONTROL DE TEMA, LOGIN Y PASE VIP */}
        <header className={styles.header}>
          <div className={styles.logo}>
            <Flame size={26} color="#ff007f" aria-hidden="true" />
            <span>
              SHOT<span className={styles.logoAccent}>SY</span>
            </span>
          </div>

          <div className={styles.headerActions}>
            {/* Toggle Modo Oscuro / Claro */}
            <button
              type="button"
              className={styles.iconBtn}
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
              title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>

            {/* Redes Sociales */}
            <a
              href="https://www.instagram.com/shotsygamesbo/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram oficial de Shotsy"
              className={styles.iconBtn}
            >
              <InstagramIcon size={19} />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61595931090570"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook oficial de Shotsy"
              className={styles.iconBtn}
            >
              <FacebookIcon size={19} />
            </a>

            {/* Login / Usuario */}
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className={styles.userBadge}>
                  {currentUser.email?.split('@')[0]}
                  {isVip && <Crown size={13} color="#ffb703" />}
                </span>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={handleLogout}
                  title="Cerrar Sesión"
                  aria-label="Cerrar Sesión"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.authBtn}
                onClick={() => {
                  setAuthReason('general');
                  setShowAuthModal(true);
                }}
              >
                <LogIn size={15} />
                <span>Ingresar</span>
              </button>
            )}

            {/* Botón Pase VIP */}
            <button
              type="button"
              className={styles.vipButton}
              onClick={handleOpenVipModal}
              aria-label="Abrir modal del Pase VIP"
            >
              <Crown size={16} aria-hidden="true" />
              <span>{isVip ? 'VIP Activo' : 'Pase VIP ($0.99)'}</span>
            </button>
          </div>
        </header>

        {/* HERO SEO PRINCIPAL */}
        <main>
          <section className={styles.hero}>
            <span className={styles.badge}>
              <Sparkles size={14} aria-hidden="true" />
              Web App para Previas
            </span>
            <h1 className={styles.title}>
              Ruleta y Retos para Previas y Tragos con Amigos
            </h1>
            <p className={styles.subtitle}>
              Elige tu modo de juego, gira la ruleta con los nombres de tus amigos o saca
              cartas sin repetir de Yo Nunca y retos extremos directo en tu celular.
            </p>

            {/* Barra de Acciones Secundarias */}
            <div className={styles.subBar}>
              <button
                type="button"
                className={styles.suggestPill}
                onClick={handleOpenSuggestModal}
                aria-label="Sugerir un nuevo reto para la comunidad"
              >
                <Lightbulb size={16} color="#00f2fe" aria-hidden="true" />
                <span>
                  Sugerir Reto {isVip ? '(VIP Ilimitado)' : `(${Math.max(0, 5 - suggestCount)} gratis)`}
                </span>
              </button>
            </div>
          </section>

          {/* SELECTOR DE MODOS (MAZO / RULETA) */}
          <section aria-label="Modos de juego" className={styles.tabsContainer}>
            <div className={styles.tabs} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'cartas'}
                className={`${styles.tabBtn} ${
                  activeTab === 'cartas' ? styles.tabBtnActive : ''
                }`}
                onClick={() => setActiveTab('cartas')}
              >
                <Sparkles size={18} aria-hidden="true" />
                <span>Mazo de Retos</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'ruleta'}
                className={`${styles.tabBtn} ${
                  activeTab === 'ruleta' ? styles.tabBtnActive : ''
                }`}
                onClick={() => {
                  setActiveTab('ruleta');
                  setIsWheelReady(false);
                }}
              >
                <RotateCw size={18} aria-hidden="true" />
                <span>Ruleta de Shots</span>
              </button>
            </div>
          </section>

          {activeTab === 'cartas' ? (
            <>
              {/* SELECTOR DE CATEGORÍAS */}
              <section
                aria-label="Categorías de retos para previas"
                className={styles.categoriesGrid}
              >
                {categories.map((cat) => {
                  const isSelected = selectedCategory.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleSelectCategory(cat)}
                      className={`${styles.categoryCard} ${
                        isSelected ? styles.categoryCardActive : ''
                      }`}
                      aria-pressed={isSelected}
                    >
                      <div className={styles.categoryHeader}>
                        <span className={styles.categoryName}>{cat.name}</span>
                        {cat.is_vip && !isVip && (
                          <span className={styles.vipTag}>
                            <Lock size={12} aria-hidden="true" /> VIP
                          </span>
                        )}
                      </div>
                      <p className={styles.categoryDesc}>{cat.description}</p>
                    </button>
                  );
                })}
              </section>

              {/* CARTA ACTIVA CON BARREDO SHIMMER (Sin texto de repetición) */}
              <section
                aria-label="Carta de reto actual"
                className={styles.deckSection}
              >
                <div className={styles.gameCardWrapper}>
                  <div
                    key={`${currentChallenge.id}-${cardTransitionKey}`}
                    className={`${styles.gameCard} ${styles.gameCardReveal}`}
                  >
                    <div className={styles.cardShimmer} aria-hidden="true" />
                    <span className={styles.cardType}>
                      {selectedCategory.name} • {currentChallenge.type.replace('_', ' ')}
                    </span>
                    <p className={styles.cardText}>{currentChallenge.content}</p>
                    <div className={styles.penaltyBadge}>
                      <Wine size={16} aria-hidden="true" />
                      <span>Penitencia: {currentChallenge.drinks_penalty} trago(s)</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className={styles.nextButton}
                  onClick={handleNextCard}
                  aria-label="Ver siguiente carta de reto"
                >
                  <Shuffle size={18} aria-hidden="true" />
                  <span>Siguiente Carta</span>
                </button>
              </section>
            </>
          ) : (
            /* RULETA DE SHOTS CON ESPACIADO GENEROSO */
            <section
              aria-label="Ruleta interactiva de castigos con participantes"
              className={styles.wheelSection}
            >
              {!isWheelReady ? (
                /* PASO 1: Ingreso de Participantes + Botón JUGAR */
                <div className={styles.playersConfigBox}>
                  <h2 className={styles.playersConfigTitle}>
                    <Users size={22} aria-hidden="true" />
                    <span>Participantes de la Ruleta</span>
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                    Escribe los nombres de los amigos que están en la previa para personalizar la ruleta.
                  </p>

                  <form onSubmit={handleAddPlayer} className={styles.playerInputRow}>
                    <input
                      type="text"
                      className={styles.playerInput}
                      placeholder="Nombre del amigo..."
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      maxLength={14}
                    />
                    <button type="submit" className={styles.addPlayerBtn}>
                      <Plus size={16} style={{ display: 'inline', marginRight: 4 }} />
                      Añadir
                    </button>
                  </form>

                  <div className={styles.playersListContainer}>
                    {participants.length === 0 ? (
                      <span className={styles.emptyPlayersNotice}>
                        No hay participantes aún. Añade al menos 2 amigos para comenzar la ronda.
                      </span>
                    ) : (
                      participants.map((player) => (
                        <span key={player} className={styles.playerChip}>
                          {player}
                          <button
                            type="button"
                            className={styles.removeChipBtn}
                            onClick={() => handleRemovePlayer(player)}
                            aria-label={`Eliminar a ${player}`}
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    className={styles.playWheelBtn}
                    disabled={participants.length < 2}
                    onClick={() => {
                      if (participants.length < 2) {
                        alert('Ingresa al menos 2 participantes para jugar.');
                        return;
                      }
                      setIsWheelReady(true);
                    }}
                  >
                    <Play size={20} fill="currentColor" />
                    <span>
                      {participants.length >= 2
                        ? `¡JUGAR CON ${participants.length} AMIGOS!`
                        : 'AÑADE AL MENOS 2 AMIGOS'}
                    </span>
                  </button>
                </div>
              ) : (
                /* PASO 2: Ruleta Generada con Espaciado Generoso y Nombres Orientados */
                <>
                  <div className={styles.wheelWrapper}>
                    <div
                      className={`${styles.wheelRing} ${
                        isSpinning ? styles.wheelRingSpinning : ''
                      }`}
                      aria-hidden="true"
                    />
                    <div className={styles.wheelPointer} aria-hidden="true" />

                    <div
                      className={styles.wheel}
                      style={{
                        background: wheelBackground,
                        transform: `rotate(${wheelRotation}deg)`,
                      }}
                      aria-label="Ruleta giratoria"
                    >
                      {/* Nombres mostrados radialmente y orientados para nunca quedar de cabeza */}
                      {participants.map((player, idx) => {
                        const sliceAngle = 360 / participants.length;
                        const angle = idx * sliceAngle + sliceAngle / 2;
                        const isUpsideDown = angle > 90 && angle < 270;
                        const textRotation = isUpsideDown ? angle + 180 : angle;
                        const offset = isUpsideDown ? '80px' : '-80px';

                        return (
                          <div
                            key={player + idx}
                            className={styles.sectorLabel}
                            style={{
                              transform: `translate(-50%, -50%) rotate(${textRotation}deg) translateY(${offset})`,
                            }}
                          >
                            {player}
                          </div>
                        );
                      })}
                    </div>

                    {/* Centro Fijo SHOTSY: no rota con la ruleta */}
                    <div className={styles.wheelCenterCap}>SHOTSY</div>
                  </div>

                  <div className={styles.wheelResultBox} aria-live="polite">
                    <div className={styles.wheelResultTitle}>Resultado de la ronda</div>
                    <div className={styles.wheelResultText}>{wheelResult}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      type="button"
                      className={styles.nextButton}
                      onClick={handleSpinWheel}
                      disabled={isSpinning}
                      aria-label={isSpinning ? 'La ruleta está girando' : 'Girar la ruleta de shots'}
                    >
                      <RotateCw size={18} aria-hidden="true" />
                      <span>{isSpinning ? 'Girando...' : 'Girar Ruleta'}</span>
                    </button>

                    <button
                      type="button"
                      className={styles.modifyPlayersBtn}
                      onClick={() => setIsWheelReady(false)}
                      disabled={isSpinning}
                    >
                      <Users size={16} style={{ display: 'inline', marginRight: 6 }} />
                      Editar Participantes
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          {/* ARTÍCULOS SEMÁNTICOS ON-PAGE */}
          <section
            className={styles.seoSection}
            aria-label="Guía de juego y preguntas frecuentes"
          >
            <article className={styles.seoArticle}>
              <h2>¿Cómo jugar a Shotsy en tu previa?</h2>
              <p>
                Reúne a tu grupo, coloca el celular al centro de la mesa y
                añade los nombres de tus amigos a la ruleta personalizada de shots o saca cartas interactivas de Yo Nunca.
              </p>
            </article>
            <article className={styles.seoArticle}>
              <h2>Modos Gratuitos y Experiencia VIP</h2>
              <p>
                Disfruta de 75 retos en Previa Suave y 100 confesiones en Yo Nunca Clásico.
                Desbloquea el Pase VIP por solo $0.99 USD para acceder a Modo Fuego +18 y Pa' quedar hecho P
                con sugerencias ilimitadas de la comunidad.
              </p>
            </article>
          </section>
        </main>

        {/* MODAL DE LOGIN / REGISTRO (SIN PLACEHOLDERS) */}
        {showAuthModal && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowAuthModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            <div
              className={`${styles.modalContent} ${styles.authModalContent}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="auth-modal-title" className={`${styles.modalTitle} ${styles.authModalTitle}`}>
                {authMode === 'login' ? 'Iniciar Sesión en Shotsy' : 'Crear Cuenta en Shotsy'}
              </h2>
              <p className={styles.modalDesc}>
                {authReason === 'vip'
                  ? 'Debes iniciar sesión para activar y vincular tu Pase VIP ($0.99 USD).'
                  : authReason === 'suggest'
                  ? 'Debes iniciar sesión para enviar sugerencias de retos a la comunidad.'
                  : 'Ingresa para guardar tu progreso y retos favoritos.'}
              </p>

              {/* Botón de Google OAuth */}
              <button
                type="button"
                className={styles.googleBtn}
                onClick={handleGoogleAuth}
                disabled={authLoading}
              >
                <GoogleLogoSvg />
                <span>Continuar con Google</span>
              </button>

              <div className={styles.authDivider}>o con tu correo</div>

              {/* Selector de Pestaña Login / Registro */}
              <div className={styles.authTabs}>
                <button
                  type="button"
                  className={`${styles.authTabBtn} ${authMode === 'login' ? styles.authTabBtnActive : ''}`}
                  onClick={() => setAuthMode('login')}
                >
                  Ya tengo cuenta
                </button>
                <button
                  type="button"
                  className={`${styles.authTabBtn} ${authMode === 'register' ? styles.authTabBtnActive : ''}`}
                  onClick={() => setAuthMode('register')}
                >
                  Crear cuenta
                </button>
              </div>

              {authError && (
                <div style={{ padding: '8px 12px', background: 'rgba(255, 8, 68, 0.15)', border: '1px solid var(--neon-red)', borderRadius: 8, color: '#ff6b8b', fontSize: '0.84rem' }}>
                  {authError}
                </div>
              )}

              <form onSubmit={handleEmailAuth} className={styles.authForm}>
                <div>
                  <label className={styles.formLabel}>Correo Electrónico</label>
                  <input
                    type="email"
                    className={styles.formInput}
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className={styles.formLabel}>Contraseña</label>
                  <input
                    type="password"
                    className={styles.formInput}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  className={styles.playWheelBtn}
                  disabled={authLoading}
                  style={{ fontSize: '0.95rem', minHeight: 48 }}
                >
                  {authLoading
                    ? 'Procesando...'
                    : authMode === 'login'
                    ? 'Iniciar Sesión'
                    : 'Registrarse Gratis'}
                </button>
              </form>

              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setShowAuthModal(false)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* MODAL PASE VIP ($0.99 USD) */}
        {showVipModal && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowVipModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="vip-modal-title"
          >
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="vip-modal-title" className={styles.modalTitle}>
                Desbloquea Shotsy VIP
              </h2>
              <p className={styles.modalDesc}>
                Accede a las categorías exclusivas y envía sugerencias ilimitadas
                por un pago único de <strong>$0.99 USD</strong>.
              </p>
              <ul className={styles.modalList}>
                <li>
                  <Flame size={16} color="#ff007f" aria-hidden="true" />
                  <span>50 Retos ardientes de Modo Fuego (+18)</span>
                </li>
                <li>
                  <Wine size={16} color="#b224ef" aria-hidden="true" />
                  <span>50 Castigos extremos de Pa' quedar hecho P</span>
                </li>
                <li>
                  <Lightbulb size={16} color="#00f2fe" aria-hidden="true" />
                  <span>Sugerencias de retos ilimitadas en la comunidad</span>
                </li>
              </ul>
              <button
                type="button"
                className={styles.vipButton}
                style={{ justifyContent: 'center', width: '100%' }}
                onClick={async () => {
                  if (currentUser) {
                    try {
                      await supabase.from('profiles').upsert({
                        id: currentUser.id,
                        email: currentUser.email,
                        is_vip: true,
                      });
                    } catch {
                      // Guardar local
                    }
                  }
                  localStorage.setItem('shotsy_is_vip', 'true');
                  setUserProfile((prev) => prev ? { ...prev, is_vip: true } : { id: currentUser?.id || 'vip', email: currentUser?.email || '', is_vip: true, is_banned: false, role: 'user' });
                  setShowVipModal(false);
                  alert('¡Pase VIP activado con éxito para tu cuenta ($0.99 USD)!');
                }}
              >
                Activar Pase VIP ($0.99 USD)
              </button>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setShowVipModal(false)}
              >
                Seguir jugando en modo gratis
              </button>
            </div>
          </div>
        )}

        {/* MODAL DE SUGERIR RETO */}
        {showSuggestModal && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowSuggestModal(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="suggest-modal-title"
          >
            <div
              className={`${styles.modalContent} ${styles.suggestModalContent}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="suggest-modal-title" className={`${styles.modalTitle} ${styles.authModalTitle}`}>
                Sugerir un Reto para Shotsy
              </h2>

              <div className={`${styles.suggestQuotaBox} ${isVip ? styles.suggestQuotaVip : ''}`}>
                {isVip
                  ? '👑 Tienes Pase VIP: ¡Tus sugerencias son ilimitadas!'
                  : `🎁 Modo Gratuito: Has enviado ${suggestCount} de 5 sugerencias`}
              </div>

              {suggestSuccess ? (
                <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--neon-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#07050f' }}>
                    <Check size={28} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>
                    ¡Sugerencia Enviada!
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                    Tu reto quedó registrado para revisión del administrador.
                  </p>
                </div>
              ) : !isVip && suggestCount >= 5 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    Has alcanzado el límite de 5 sugerencias gratuitas. Activa el Pase VIP por solo $0.99 USD para enviar sugerencias ilimitadas.
                  </p>
                  <button
                    type="button"
                    className={styles.vipButton}
                    style={{ justifyContent: 'center', width: '100%' }}
                    onClick={() => {
                      setShowSuggestModal(false);
                      setShowVipModal(true);
                    }}
                  >
                    <Crown size={16} />
                    Activar VIP ($0.99 USD) para Sugerencias Ilimitadas
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendSuggestion} className={styles.suggestForm}>
                  <div>
                    <label className={styles.formLabel}>Categoría del Reto</label>
                    <select
                      className={styles.formSelect}
                      value={suggestForm.categoryId}
                      onChange={(e) => setSuggestForm({ ...suggestForm, categoryId: parseInt(e.target.value, 10) })}
                    >
                      <option value={1}>Previa Suave</option>
                      <option value={2}>Yo Nunca Clásico</option>
                      <option value={3}>Modo Fuego (+18)</option>
                      <option value={4}>Pa' quedar hecho P</option>
                    </select>
                  </div>

                  <div>
                    <label className={styles.formLabel}>Texto del Reto o Yo Nunca</label>
                    <textarea
                      className={styles.formTextarea}
                      value={suggestForm.content}
                      onChange={(e) => setSuggestForm({ ...suggestForm, content: e.target.value })}
                      required
                      maxLength={180}
                    />
                  </div>

                  <div>
                    <label className={styles.formLabel}>Penitencia (Tragos)</label>
                    <select
                      className={styles.formSelect}
                      value={suggestForm.drinks}
                      onChange={(e) => setSuggestForm({ ...suggestForm, drinks: parseInt(e.target.value, 10) })}
                    >
                      <option value={1}>1 Trago / Shot</option>
                      <option value={2}>2 Tragos</option>
                      <option value={3}>3 Tragos / Fondo Blanco</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className={styles.playWheelBtn}
                    style={{ marginTop: 8, fontSize: '0.95rem', minHeight: 48 }}
                  >
                    <Lightbulb size={18} />
                    <span>Enviar Sugerencia</span>
                  </button>
                </form>
              )}

              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setShowSuggestModal(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <footer className={styles.footer}>
          <span>© 2026 Shotsy Game. Consumo responsable (+18).</span>
          <div className={styles.footerSocials}>
            <a
              href="https://www.facebook.com/profile.php?id=61595931090570"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              Facebook
            </a>
            <a
              href="https://www.instagram.com/shotsygamesbo/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.footerLink}
            >
              Instagram
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}
