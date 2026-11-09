'use client';

import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

interface PayPalCheckoutProps {
  amount?: string;
  onSuccess: (details: { id: string; status: string }) => void;
  onError?: (errorMsg: string) => void;
  onOpenWhatsApp?: () => void;
}

export default function PayPalCheckout({
  amount = '0.99',
  onSuccess,
  onError,
  onOpenWhatsApp,
}: PayPalCheckoutProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const clientId =
    process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
    'BAAuPiCUT48IXfxbWjbo1RTfWG_VUYiJG37J8-1ySLxjP84-17W9W0aofFOwnxEIsgsASsgqPr2ZGr_iqs';

  return (
    <div style={{ width: '100%', marginTop: '12px' }}>
      {isSuccess ? (
        <div
          style={{
            padding: '18px',
            borderRadius: '16px',
            backgroundColor: 'rgba(0, 242, 254, 0.12)',
            border: '1.5px solid var(--neon-cyan, #00f2fe)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 0 25px rgba(0, 242, 254, 0.3)',
          }}
        >
          <CheckCircle size={36} color="var(--neon-cyan, #00f2fe)" />
          <strong style={{ color: '#ffffff', fontSize: '1.1rem' }}>
            ¡Pago Aprobado con Éxito!
          </strong>
          <span style={{ fontSize: '0.88rem', color: '#b8b1ce' }}>
            Tu Pase VIP ha sido activado de forma permanente.
          </span>
        </div>
      ) : (
        <>
          {errorMessage && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 0, 127, 0.12)',
                border: '1px solid rgba(255, 0, 127, 0.45)',
                color: '#ff66aa',
                fontSize: '0.84rem',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <span>{errorMessage}</span>
                {onOpenWhatsApp && (
                  <div style={{ marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={onOpenWhatsApp}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--neon-cyan, #00f2fe)',
                        textDecoration: 'underline',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '0.84rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      Pagar por QR o Transferencia (WhatsApp) →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tarjeta de Pago PayPal con diseño intencional y elegante */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '14px 16px 10px',
              border: '2px solid rgba(255, 183, 3, 0.85)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(255, 183, 3, 0.25)',
              boxSizing: 'border-box',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                fontSize: '0.74rem',
                fontWeight: 800,
                color: '#1a1429',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '10px',
                paddingBottom: '8px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
              }}
            >
              <ShieldCheck size={16} color="#d97706" />
              <span>Transacción Segura y Encriptada (SSL 256-Bit)</span>
            </div>

            <div style={{ minHeight: '110px', position: 'relative' }}>
              <PayPalScriptProvider
                options={{
                  clientId,
                  currency: 'USD',
                  intent: 'capture',
                }}
              >
                <PayPalButtons
                  style={{
                    layout: 'vertical',
                    color: 'gold',
                    shape: 'pill',
                    label: 'pay',
                    height: 48,
                  }}
                  disabled={isProcessing}
                  createOrder={(_data, actions) => {
                    setErrorMessage(null);
                    setIsProcessing(true);
                    return actions.order.create({
                      intent: 'CAPTURE',
                      purchase_units: [
                        {
                          description: 'Shotsy Game - Pase VIP Ilimitado',
                          amount: {
                            currency_code: 'USD',
                            value: amount,
                          },
                        },
                      ],
                    });
                  }}
                  onApprove={async (_data, actions) => {
                    try {
                      if (actions.order) {
                        const order = await actions.order.capture();
                        setIsSuccess(true);
                        setIsProcessing(false);
                        onSuccess({
                          id: order.id || 'paypal-ok',
                          status: order.status || 'COMPLETED',
                        });
                      }
                    } catch (err: unknown) {
                      setIsProcessing(false);
                      const msg =
                        err instanceof Error
                          ? err.message
                          : 'Error al capturar la orden de PayPal.';
                      setErrorMessage(msg);
                      if (onError) onError(msg);
                    }
                  }}
                  onError={(err: unknown) => {
                    setIsProcessing(false);
                    const msg =
                      err instanceof Error
                        ? err.message
                        : 'No se pudo conectar con PayPal. Verifica tu conexión o intenta con otra tarjeta.';
                    setErrorMessage(msg);
                    if (onError) onError(msg);
                  }}
                  onCancel={() => {
                    setIsProcessing(false);
                    setErrorMessage('Cancelaste el pago en PayPal.');
                  }}
                />
              </PayPalScriptProvider>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
