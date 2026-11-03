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
  X,
  Lightbulb,
  Check,
} from 'lucide-react';
import { supabase, Category, Challenge } from '@/lib/supabase';
import { INITIAL_CATEGORIES, ALL_CHALLENGES } from '@/lib/challenges-data';
import styles from './page.module.css';

// ============================================================================
// Componentes SVG Nativos para Redes Sociales (Web Artifacts Builder)
// ============================================================================
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

// Algoritmo de barajado Fisher-Yates
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const DEFAULT_PARTICIPANTS = ['Lucas', 'Camila', 'Mateo', 'Sofia'];

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
  const [seenCounts, setSeenCounts] = useState<Record<number, number>>({ 1: 1, 2: 0, 3: 0, 4: 0 });
  const [cardTransitionKey, setCardTransitionKey] = useState<number>(0);

  // Participantes de la Ruleta
  const [participants, setParticipants] = useState<string[]>(DEFAULT_PARTICIPANTS);
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [isWheelReady, setIsWheelReady] = useState<boolean>(true);

  // Estado de la Ruleta
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelResult, setWheelResult] = useState<string>('Gira la ruleta para iniciar la ronda');

  // Modales
  const [showVipModal, setShowVipModal] = useState<boolean>(false);
  const [isVipUser, setIsVipUser] = useState<boolean>(false);

  // Modal de Sugerir Retos (Free max 5 vs VIP ilimitado)
  const [showSuggestModal, setShowSuggestModal] = useState<boolean>(false);
  const [suggestCount, setSuggestCount] = useState<number>(0);
  const [suggestSuccess, setSuggestSuccess] = useState<boolean>(false);
  const [suggestForm, setSuggestForm] = useState({
    categoryId: 1,
    content: '',
    drinks: 2,
  });

  // 1. Inicialización de Tema y almacenamiento local
  useEffect(() => {
    const savedTheme = (localStorage.getItem('shotsy_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const savedSuggestCount = parseInt(localStorage.getItem('shotsy_suggest_count') || '0', 10);
    setSuggestCount(savedSuggestCount);

    const savedVip = localStorage.getItem('shotsy_is_vip') === 'true';
    setIsVipUser(savedVip);
  }, []);

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
          if (catData && catData.length > 0) {
            setCategories(catData);
          }
          if (chalData && chalData.length > 0) {
            setAllChallenges(chalData);
          }
        }
      } catch {
        // Mantiene fallbacks locales
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

      // Si el mazo no existe o se acabaron las cartas, barajar nuevamente
      if (!activeDeck || activeDeck.length === 0) {
        activeDeck = shuffleArray(categoryChallenges);
      }

      const nextCard = activeDeck[0] || categoryChallenges[0];
      const remainingDeck = activeDeck.slice(1);

      return {
        card: nextCard,
        updatedDeck: remainingDeck,
        totalCategoryChallenges: categoryChallenges.length,
      };
    },
    [allChallenges]
  );

  // Inicializar la primera carta de la categoría activa
  useEffect(() => {
    if (allChallenges.length > 0) {
      const { card, updatedDeck } = getNextCardFromDeck(selectedCategory.id, decks);
      setCurrentChallenge(card);
      setDecks((prev) => ({ ...prev, [selectedCategory.id]: updatedDeck }));
      setSeenCounts((prev) => ({ ...prev, [selectedCategory.id]: 1 }));
    }
  }, [selectedCategory.id]);

  // Selección de categoría
  const handleSelectCategory = (cat: Category) => {
    if (cat.is_vip && !isVipUser) {
      setShowVipModal(true);
      return;
    }
    setSelectedCategory(cat);
    const { card, updatedDeck } = getNextCardFromDeck(cat.id, decks);
    setCurrentChallenge(card);
    setDecks((prev) => ({ ...prev, [cat.id]: updatedDeck }));
    setSeenCounts((prev) => ({
      ...prev,
      [cat.id]: (prev[cat.id] || 0) + 1,
    }));
    setCardTransitionKey((prev) => prev + 1);
  };

  // Pasar a la siguiente carta sin repetir en esta sesión
  const handleNextCard = () => {
    const { card, updatedDeck } = getNextCardFromDeck(selectedCategory.id, decks);
    setCurrentChallenge(card);
    setDecks((prev) => ({ ...prev, [selectedCategory.id]: updatedDeck }));
    setSeenCounts((prev) => ({
      ...prev,
      [selectedCategory.id]: (prev[selectedCategory.id] || 0) + 1,
    }));
    setCardTransitionKey((prev) => prev + 1);
  };

  // Total de retos disponibles en la categoría seleccionada
  const totalInSelectedCategory = useMemo(() => {
    return allChallenges.filter((c) => c.category_id === selectedCategory.id).length;
  }, [allChallenges, selectedCategory.id]);

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
    if (participants.length <= 2) return;
    setParticipants(participants.filter((p) => p !== nameToRemove));
  };

  // Construir conic-gradient para la ruleta según los participantes
  const wheelBackground = useMemo(() => {
    const count = participants.length;
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
        particleCount: 70,
        spread: 75,
        origin: { y: 0.7 },
        colors: ['#ff007f', '#00f2fe', '#8a2be2', '#ffb703'],
      });
    }, 3600);
  };

  // 5. Envío de Sugerencias de Retos
  const handleSendSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestForm.content.trim()) return;

    if (!isVipUser && suggestCount >= 5) {
      alert('Has alcanzado el límite de 5 sugerencias del modo gratuito. ¡Pasa a VIP para enviar retos ilimitados!');
      return;
    }

    const nextCount = suggestCount + 1;
    setSuggestCount(nextCount);
    localStorage.setItem('shotsy_suggest_count', nextCount.toString());

    // Resiliencia: registrar localmente y confirmar
    setSuggestSuccess(true);
    setTimeout(() => {
      setSuggestSuccess(false);
      setSuggestForm({ ...suggestForm, content: '' });
      setShowSuggestModal(false);
    }, 2000);
  };

  // Accesibilidad: Tecla Escape para modales
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowVipModal(false);
        setShowSuggestModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Microdatos JSON-LD
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
      price: '0.00',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      {/* FONDO ANIMADO INTERACTIVO A 60 FPS (Taste & Transitions) */}
      <div className={styles.backgroundRoot} aria-hidden="true">
        <div className={styles.ambientMesh} />
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>

      <div className={styles.container}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* HEADER CON CONTROL DE TEMA, REDES Y PASE VIP */}
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

            {/* Botón Pase VIP */}
            <button
              type="button"
              className={styles.vipButton}
              onClick={() => setShowVipModal(true)}
              aria-label="Abrir modal del Pase VIP"
            >
              <Crown size={16} aria-hidden="true" />
              <span>{isVipUser ? 'VIP Activo' : 'Pase VIP'}</span>
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
              Elige tu modo de juego, gira la ruleta de shots con tus amigos o saca
              cartas sin repetir de Yo Nunca y retos extremos directo desde el navegador.
            </p>

            {/* Botón para Sugerir Retos */}
            <div className={styles.subBar}>
              <button
                type="button"
                className={styles.suggestPill}
                onClick={() => setShowSuggestModal(true)}
                aria-label="Sugerir un nuevo reto para la comunidad"
              >
                <Lightbulb size={16} color="#00f2fe" aria-hidden="true" />
                <span>
                  Sugerir Reto {isVipUser ? '(VIP Ilimitado)' : `(${5 - suggestCount} gratis)`}
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
                onClick={() => setActiveTab('ruleta')}
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
                        {cat.is_vip && !isVipUser && (
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

              {/* CARTA ACTIVA CON BARREDO SHIMMER Y SIN REPETICIÓN */}
              <section
                aria-label="Carta de reto actual"
                className={styles.deckSection}
              >
                {/* Contador de Sesión */}
                <div className={styles.sessionProgress}>
                  <span className={styles.progressDot} />
                  <span>
                    Reto {seenCounts[selectedCategory.id] || 1} de {totalInSelectedCategory} en esta previa (sin repetir)
                  </span>
                </div>

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
            /* RULETA CON CONFIGURACIÓN DE PARTICIPANTES */
            <section
              aria-label="Ruleta interactiva de castigos con participantes"
              className={styles.wheelSection}
            >
              {!isWheelReady ? (
                /* Configuración de Jugadores */
                <div className={styles.playersConfigBox}>
                  <h2 className={styles.playersConfigTitle}>
                    <Users size={20} aria-hidden="true" />
                    <span>Añade los Jugadores de la Previa</span>
                  </h2>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
                    Ingresa los nombres de quienes están jugando para personalizar la ruleta.
                  </p>

                  <form onSubmit={handleAddPlayer} className={styles.playerInputRow}>
                    <input
                      type="text"
                      className={styles.playerInput}
                      placeholder="Nombre del amigo..."
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      maxLength={18}
                    />
                    <button type="submit" className={styles.addPlayerBtn}>
                      <Plus size={16} style={{ display: 'inline', marginRight: 4 }} />
                      Añadir
                    </button>
                  </form>

                  <div className={styles.playersListContainer}>
                    {participants.map((player) => (
                      <span key={player} className={styles.playerChip}>
                        {player}
                        {participants.length > 2 && (
                          <button
                            type="button"
                            className={styles.removeChipBtn}
                            onClick={() => handleRemovePlayer(player)}
                            aria-label={`Eliminar a ${player}`}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    className={styles.generateWheelBtn}
                    onClick={() => setIsWheelReady(true)}
                  >
                    <RotateCw size={18} />
                    <span>Generar Ruleta con {participants.length} Jugadores</span>
                  </button>
                </div>
              ) : (
                /* Ruleta Lista para Girar */
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
                      <div className={styles.wheelCenterCap}>SHOTSY</div>
                    </div>
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
                      Editar Participantes ({participants.length})
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
                elige entre sacar cartas interactivas sin repetir o girar la ruleta de
                shots con los nombres de todos los participantes.
              </p>
            </article>
            <article className={styles.seoArticle}>
              <h2>Modos Gratuitos y Experiencia VIP</h2>
              <p>
                Disfruta de 75 retos en Previa Suave y 100 confesiones en Yo Nunca Clásico.
                Desbloquea el Pase VIP para acceder a Modo Fuego +18 y Pa' quedar hecho P
                con sugerencias ilimitadas de la comunidad.
              </p>
            </article>
          </section>
        </main>

        {/* MODAL PASE VIP */}
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
                Accede a las categorías exclusivas y envía sugerencias sin límites
                por un pago único de <strong>$1.99 USD</strong>.
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
                  <span>Envío de sugerencias de retos ilimitadas</span>
                </li>
              </ul>
              <button
                type="button"
                className={styles.vipButton}
                style={{ justifyContent: 'center', width: '100%' }}
                onClick={() => {
                  setIsVipUser(true);
                  localStorage.setItem('shotsy_is_vip', 'true');
                  setShowVipModal(false);
                  alert('¡Pase VIP activado para esta sesión!');
                }}
              >
                Activar Pase VIP ($1.99 USD)
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

        {/* MODAL DE SUGERIR RETO (FREE 5 vs VIP ILIMITADO) */}
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
              <h2 id="suggest-modal-title" className={`${styles.modalTitle} ${styles.suggestModalTitle}`}>
                Sugerir un Reto para Shotsy
              </h2>

              {/* Indicador de Cuota */}
              <div className={`${styles.suggestQuotaBox} ${isVipUser ? styles.suggestQuotaVip : ''}`}>
                {isVipUser
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
                    Revisaremos tu reto para añadirlo a la próxima previa de Shotsy.
                  </p>
                </div>
              ) : !isVipUser && suggestCount >= 5 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                    Has completado tus 5 sugerencias de usuario gratuito. Inicia sesión o activa el Pase VIP para seguir enviando retos ilimitados.
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
                    Desbloquear Sugerencias Ilimitadas con VIP
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
                      placeholder="Ej: Yo nunca he bailado arriba de la barra de un bar..."
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
                    className={styles.generateWheelBtn}
                    style={{ marginTop: 8 }}
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
