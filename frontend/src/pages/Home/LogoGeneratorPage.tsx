import { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';

const LOGO_FONT = 'Manrope';
const SQUARE_SIZE = 200;
const backSquare = { x: 132, y: 0, size: SQUARE_SIZE, letter: 'M' };
const frontSquare = { x: 0, y: 96, size: SQUARE_SIZE, letter: 'T' };
const LOGO_WIDTH = Math.max(backSquare.x + backSquare.size, frontSquare.x + frontSquare.size);
const LOGO_HEIGHT = Math.max(backSquare.y + backSquare.size, frontSquare.y + frontSquare.size);

const drawLogo = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  const rootStyles = getComputedStyle(document.documentElement);
  const brandPrimary = rootStyles.getPropertyValue('--brand-600').trim() || '#7c3aed';
  const brandLighter = rootStyles.getPropertyValue('--brand-400').trim() || '#a78bfa';

  canvas.width = LOGO_WIDTH;
  canvas.height = LOGO_HEIGHT;
  ctx.clearRect(0, 0, LOGO_WIDTH, LOGO_HEIGHT);

  const backSquareDraw = { ...backSquare, color: brandLighter };
  const frontSquareDraw = { ...frontSquare, color: brandPrimary };
  const radius = 24;

  const drawRoundedSquarePath = (x: number, y: number, size: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + size - radius, y);
    ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
    ctx.lineTo(x + size, y + size - radius);
    ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
    ctx.lineTo(x + radius, y + size);
    ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const drawSquare = (x: number, y: number, size: number, color: string) => {
    drawRoundedSquarePath(x, y, size);

    ctx.fillStyle = color;
    ctx.fill();
  };

  const drawLetter = (x: number, y: number, size: number, letter: string) => {
    ctx.save();
    drawRoundedSquarePath(x, y, size);
    ctx.clip();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 188px "${LOGO_FONT}", ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.fillText(letter, x + size / 2, y + size / 2 + 10);

    ctx.restore();
  };

  drawSquare(backSquareDraw.x, backSquareDraw.y, backSquareDraw.size, backSquareDraw.color);
  drawLetter(backSquareDraw.x, backSquareDraw.y, backSquareDraw.size, backSquareDraw.letter);

  drawSquare(frontSquareDraw.x, frontSquareDraw.y, frontSquareDraw.size, frontSquareDraw.color);
  drawLetter(frontSquareDraw.x, frontSquareDraw.y, frontSquareDraw.size, frontSquareDraw.letter);
};

export const LogoGeneratorPage = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    let isMounted = true;

    const renderLogo = async () => {
      if (!canvasRef.current) {
        return;
      }

      try {
        await document.fonts.load(`800 188px "${LOGO_FONT}"`);
      } catch {
      }

      if (isMounted && canvasRef.current) {
        drawLogo(canvasRef.current);
      }
    };

    void renderLogo();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDownload = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    setStatusTone(null);

    const canvas = canvasRef.current;
    if (!canvas) {
      setIsSaving(false);
      setStatusTone('error');
      setStatusMessage('Canvas not ready. Please refresh and try again.');
      return;
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/png');
    });

    if (!blob) {
      setIsSaving(false);
      setStatusTone('error');
      setStatusMessage('Could not generate PNG from canvas.');
      return;
    }

    const fileName = 'logo-tm.png';
    try {
      const formData = new FormData();
      const logoFile = new File([blob], fileName, { type: 'image/png' });
      formData.append('file', logoFile);

      await api.post('/admin/assets/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setStatusTone('success');
      setStatusMessage('Saved to project: frontend/public/logos/logo-tm.png');
      setIsSaving(false);

      return;
    } catch {
    }

    const imageUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(imageUrl);

    setStatusTone('success');
    setStatusMessage('Saved to your device downloads (project save was unavailable).');
    setIsSaving(false);
  };

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="flex flex-col items-center gap-4">
        <canvas
          ref={canvasRef}
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          className="h-80 w-auto rounded-md border border-dashed border-zinc-500/70 bg-[linear-gradient(45deg,rgba(255,255,255,0.04)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.04)_75%,rgba(255,255,255,0.04)),linear-gradient(45deg,rgba(255,255,255,0.04)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.04)_75%,rgba(255,255,255,0.04))] bg-[length:16px_16px] bg-[position:0_0,8px_8px]"
          aria-label="TM logo preview"
        />
        <button
          type="button"
          onClick={handleDownload}
          disabled={isSaving}
          className="rounded-md bg-brand-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg"
        >
          {isSaving ? 'Saving...' : 'Download Logo'}
        </button>
        {statusMessage ? (
          <p className={statusTone === 'error' ? 'text-sm text-rose-400' : 'text-sm text-emerald-400'} aria-live="polite">
            {statusMessage}
          </p>
        ) : null}
      </div>
    </main>
  );
};
