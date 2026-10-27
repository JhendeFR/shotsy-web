'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Flame,
  Sparkles,
  Lock,
  RotateCw,
  Shuffle,
  Crown,
  Wine,
} from 'lucide-react';
import { supabase, Category, Challenge } from '@/lib/supabase';
import styles from './page.module.css';

// Componentes SVG nativos para redes sociales (evita dependencias de marcas en lucide)
function InstagramIcon({ size = 18 }: { size?: number }) {
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
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

const FALLBACK_CATEGORIES: Category[] = [
  {
    id: 1,
    slug: 'previa-suave',
    name: 'Previa Suave',
    description: 'Para romper el hielo y empezar la noche.',
    icon: 'beer',
    color_hex: '#00f2fe',
    is_vip: false,
  },
  {
    id: 2,
    slug: 'yo-nunca',
    name: 'Yo Nunca Clásico',
    description: 'Confesiones rápidas. Si lo hiciste, tomas.',
    icon: 'hand',
    color_hex: '#a8ff78',
    is_vip: false,
  },
  {
    id: 3,
    slug: 'picante-vip',
    name: 'Modo Fuego +18',
    description: 'Retos intensos y preguntas sin filtro.',
    icon: 'flame',
    color_hex: '#ff0844',
    is_vip: true,
  },
  {
    id: 4,
    slug: 'extremo-vip',
    name: 'Penitencias Extremas',
    description: 'Solo para valientes. Retos grupales pesados.',
    icon: 'skull',
    color_hex: '#b224ef',
    is_vip: true,
  },
];

const FALLBACK_CHALLENGES: Challenge[] = [
  {
    id: 1,
    category_id: 1,
    type: 'reto',
    content: 'El jugador a tu derecha elige qué canción suena ahora o tomas 2 tragos.',
    drinks_penalty: 2,
    is_vip: false,
  },
  {
    id: 2,
    category_id: 1,
    type: 'reto',
    content: 'Cuenta la historia más vergonzosa de tu última salida o toma 1 shot.',
    drinks_penalty: 1,
    is_vip: false,
  },
  {
    id: 3,
    category_id: 2,
    type: 'yo_nunca',
    content: 'Yo nunca he mandado un mensaje a mi ex después de la 1:00 AM.',
    drinks_penalty: 1,
    is_vip: false,
  },
  {
    id: 4,
    category_id: 2,
    type: 'yo_nunca',
    content: 'Yo nunca he fingido estar sobrio frente a mis papás al llegar a casa.',
    drinks_penalty: 1,
    is_vip: false,
  },
];

const WHEEL_OPTIONS = [
  'Tomas 1 Shot',
  'Verdad o 2 Tragos',
  'Elige quién bebe',
  'Todos toman 1',
  'Te salvas esta ronda',
  'Fondo Blanco / 3 Tragos',
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'cartas' | 'ruleta'>('cartas');
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [challenges, setChallenges] = useState<Challenge[]>(FALLBACK_CHALLENGES);
  const [selectedCategory, setSelectedCategory] = useState<Category>(FALLBACK_CATEGORIES[0]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);

  // Estado de la Ruleta
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelResult, setWheelResult] = useState<string>('Gira la ruleta para iniciar la ronda');

  // Estado del Modal VIP
  const [showVipModal, setShowVipModal] = useState<boolean>(false);

  useEffect(() => {
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

        if (catData && catData.length > 0) {
          setCategories(catData);
          setSelectedCategory(catData[0]);
        }
        if (chalData && chalData.length > 0) {
          setChallenges(chalData);
        }
      } catch {
        // Mantiene datos locales de respaldo si falla la red
      }
    }
    fetchGameData();
  }, []);

  const filteredChallenges = challenges.filter(
    (c) => c.category_id === selectedCategory.id
  );

  const currentChallenge =
    filteredChallenges[currentCardIndex] ||
    filteredChallenges[0] ||
    FALLBACK_CHALLENGES[0];

  const handleSelectCategory = (cat: Category) => {
    if (cat.is_vip) {
      setShowVipModal(true);
      return;
    }
    setSelectedCategory(cat);
    setCurrentCardIndex(0);
  };

  const handleNextCard = () => {
    if (filteredChallenges.length <= 1) return;
    const nextIndex = (currentCardIndex + 1) % filteredChallenges.length;
    setCurrentCardIndex(nextIndex);
  };

  const handleSpinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setWheelResult('Girando...');

    const extraSpins = 5 * 360;
    const randomAngle = Math.floor(Math.random() * 360);
    const newRotation = wheelRotation + extraSpins + randomAngle;
    setWheelRotation(newRotation);

    setTimeout(() => {
      const normalizedAngle = (360 - (newRotation % 360)) % 360;
      const segmentIndex = Math.floor(normalizedAngle / 60);
      const outcome = WHEEL_OPTIONS[segmentIndex] || WHEEL_OPTIONS[0];
      setWheelResult(outcome);
      setIsSpinning(false);

      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.7 },
      });
    }, 3600);
  };

  // Microdatos JSON-LD para SEO (Hito 6)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Shotsy',
    url: 'https://shotsygame.com',
    applicationCategory: 'GameApplication',
    operatingSystem: 'All',
    description:
      'Aplicación web de ruleta y retos para previas, Yo Nunca y Verdad o Reto desde el navegador móvil.',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
    },
  };

  return (
    <div className={styles.container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* HEADER CON REDES SOCIALES (HITO 5) */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <Flame size={26} color="#ff007f" />
          <span>
            SHOT<span className={styles.logoAccent}>SY</span>
          </span>
        </div>

        <div className={styles.headerActions}>
          <a
            href="https://www.instagram.com/shotsygamesbo/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram oficial de Shotsy"
            className={styles.socialLink}
          >
            <InstagramIcon size={18} />
          </a>
          <a
            href="https://www.facebook.com/profile.php?id=61595931090570"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook oficial de Shotsy"
            className={styles.socialLink}
          >
            <FacebookIcon size={18} />
          </a>
          <button
            type="button"
            className={styles.vipButton}
            onClick={() => setShowVipModal(true)}
          >
            <Crown size={15} />
            <span>Pase VIP</span>
          </button>
        </div>
      </header>

      {/* HERO PRINCIPAL CON ESTRUCTURA H1 PARA SEO (HITO 6) */}
      <main>
        <section className={styles.hero}>
          <span className={styles.badge}>Web App para Previas</span>
          <h1 className={styles.title}>
            Ruleta y Retos para Previas y Tragos con Amigos
          </h1>
          <p className={styles.subtitle}>
            Elige un modo de juego, gira la ruleta de castigos o saca una carta
            de Yo Nunca y Verdad o Reto directo desde tu celular sin instalar nada.
          </p>
        </section>

        {/* SELECTOR DE HERRAMIENTA DEL JUEGO (HITO 7) */}
        <section aria-label="Modos de interacción" style={{ marginTop: '1.5rem' }}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tabBtn} ${
                activeTab === 'cartas' ? styles.tabBtnActive : ''
              }`}
              onClick={() => setActiveTab('cartas')}
            >
              <Sparkles size={18} />
              <span>Mazo de Retos</span>
            </button>

            <button
              type="button"
              className={`${styles.tabBtn} ${
                activeTab === 'ruleta' ? styles.tabBtnActive : ''
              }`}
              onClick={() => setActiveTab('ruleta')}
            >
              <RotateCw size={18} />
              <span>Ruleta de Shots</span>
            </button>
          </div>
        </section>

        {activeTab === 'cartas' ? (
          <>
            {/* SELECTOR DE CATEGORÍAS CONECTADO A SUPABASE */}
            <section
              aria-label="Categorías de retos"
              style={{ marginTop: '1.5rem' }}
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
                  >
                    <div className={styles.categoryHeader}>
                      <span className={styles.categoryName}>{cat.name}</span>
                      {cat.is_vip && (
                        <span className={styles.vipTag}>
                          <Lock size={12} /> VIP
                        </span>
                      )}
                    </div>
                    <p className={styles.categoryDesc}>{cat.description}</p>
                  </button>
                );
              })}
            </section>

            {/* CARTA ACTIVA */}
            <section
              aria-label="Carta de reto actual"
              style={{ marginTop: '1.75rem' }}
              className={styles.deckSection}
            >
              <div className={styles.gameCard}>
                <span className={styles.cardType}>
                  {selectedCategory.name} • {currentChallenge.type.replace('_', ' ')}
                </span>
                <p className={styles.cardText}>{currentChallenge.content}</p>
                <div className={styles.penaltyBadge}>
                  <Wine size={16} />
                  <span>Penitencia: {currentChallenge.drinks_penalty} trago(s)</span>
                </div>
              </div>

              <button
                type="button"
                className={styles.nextButton}
                onClick={handleNextCard}
              >
                <Shuffle size={18} />
                <span>Siguiente Carta</span>
              </button>
            </section>
          </>
        ) : (
          /* RULETA INTERACTIVA */
          <section
            aria-label="Ruleta de castigos"
            style={{ marginTop: '2rem' }}
            className={styles.wheelSection}
          >
            <div className={styles.wheelWrapper}>
              <div className={styles.wheelPointer} />
              <div
                className={styles.wheel}
                style={{ transform: `rotate(${wheelRotation}deg)` }}
              />
            </div>

            <div className={styles.wheelResultBox}>
              <div className={styles.wheelResultTitle}>Resultado de la ronda</div>
              <div className={styles.wheelResultText}>{wheelResult}</div>
            </div>

            <button
              type="button"
              className={styles.nextButton}
              onClick={handleSpinWheel}
              disabled={isSpinning}
            >
              <RotateCw size={18} />
              <span>{isSpinning ? 'Girando...' : 'Girar Ruleta'}</span>
            </button>
          </section>
        )}

        {/* SECCIÓN SEMÁNTICA ON-PAGE PARA AUDITORÍA SEO (HITO 6) */}
        <section className={styles.seoSection} aria-label="Información sobre Shotsy">
          <article className={styles.seoArticle}>
            <h2>¿Cómo jugar a Shotsy en tu previa?</h2>
            <p>
              Reúne a tus amigos, coloca el celular en el centro de la mesa y
              selecciona entre el mazo de cartas interactivas o la ruleta de
              castigos. Cada jugador debe cumplir el reto en pantalla o tomar los
              tragos indicados.
            </p>
          </article>
          <article className={styles.seoArticle}>
            <h2>Modos Gratuitos y Experiencia VIP</h2>
            <p>
              Disfruta gratis de los modos Previa Suave y Yo Nunca Clásico.
              Desbloquea el Pase VIP para acceder a Modo Fuego +18 y Penitencias
              Extremas diseñadas para llevar la fiesta al siguiente nivel.
            </p>
          </article>
        </section>
      </main>

      {/* MODAL PREVIEW FREEMIUM / VIP */}
      {showVipModal && (
        <div className={styles.modalOverlay} onClick={() => setShowVipModal(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className={styles.modalTitle}>Desbloquea Shotsy VIP</h2>
            <p style={{ fontSize: '0.92rem', color: '#a39bbb' }}>
              Accede a todas las categorías extremas y picantes sin límites por
              un único pago de <strong>$1.99 USD</strong>.
            </p>
            <ul className={styles.modalList}>
              <li>✓ +100 cartas de Modo Fuego (+18)</li>
              <li>✓ Rondas de Penitencias Extremas</li>
              <li>✓ Sin anuncios durante toda la previa</li>
            </ul>
            <button
              type="button"
              className={styles.vipButton}
              style={{ justifyContent: 'center', padding: '0.8rem' }}
              onClick={() => setShowVipModal(false)}
            >
              Próximamente con PayPal ($1.99 USD)
            </button>
            <button
              type="button"
              className={styles.closeModalBtn}
              onClick={() => setShowVipModal(false)}
            >
              Seguir jugando modo gratis
            </button>
          </div>
        </div>
      )}

      {/* FOOTER CON ENLACES SOCIALES (HITO 5) */}
      <footer className={styles.footer}>
        <span>© 2026 Shotsy Game. Consumo responsable (+18).</span>
        <div className={styles.footerSocials}>
          <a
            href="https://www.facebook.com/profile.php?id=61595931090570"
            target="_blank"
            rel="noopener noreferrer"
          >
            Facebook
          </a>
          <a
            href="https://www.instagram.com/shotsygamesbo/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
        </div>
      </footer>
    </div>
  );
}