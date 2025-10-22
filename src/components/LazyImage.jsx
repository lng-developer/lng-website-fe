// components/LazyImage.jsx
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Image } from 'antd';

/** ---------------------------
 * Hook useInViewLite (no deps)
 * --------------------------- */
function useInViewLite({ root = null, rootMargin = '150px', threshold = 0, once = true } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Fallback khi browser quá cũ không có IO
    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.unobserve(entry.target);
        } else if (!once) {
          setInView(false);
        }
      },
      { root, rootMargin, threshold }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [root, rootMargin, threshold, once]);

  return { ref, inView };
}

/** ---------------------------
 * Skeleton (placeholder)
 * --------------------------- */
const SkeletonBox = memo(function SkeletonBox({ width = 130, height = 130, radius = 12 }) {
  return (
    <div style={{ width, height, borderRadius: radius }} className="overflow-hidden bg-[#f5f7fb] relative">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#eef2f7] via-[#f6f8fb] to-[#eef2f7]" />
    </div>
  );
});

/** ---------------------------
 * LazyImage (dùng chung)
 * ---------------------------
 * Props:
 *  - src: string
 *  - alt?: string
 *  - width?: number|string (default 130)
 *  - height?: number|string (default 130)
 *  - objectFit?: 'contain'|'cover'|'fill'...
 *  - preview?: boolean (antd Image preview) – default false
 *  - fallbackSrc?: string (ảnh fallback)
 *  - placeholder?: ReactNode (tùy biến skeleton)
 *  - rootMargin?: string (IO)
 *  - threshold?: number|number[] (IO)
 *  - once?: boolean (IO)
 *  - wrapperClassName?: string
 *  - wrapperStyle?: React.CSSProperties
 *  - imgClassName?: string
 *  - style?: React.CSSProperties
 *  - rounded?: boolean (bo góc, default true)
 *  - shadow?: boolean (đổ bóng, default true)
 *  - onClick?: () => void
 *  - onLoad?, onError?
 */
const DEFAULT_FALLBACK = 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';

const LazyImage = memo(function LazyImage({
  src,
  alt = '',
  width = 130,
  height = 130,
  objectFit = 'contain',
  preview = false,
  fallbackSrc = DEFAULT_FALLBACK,
  placeholder,
  rootMargin = '150px',
  threshold = 0,
  once = true,
  wrapperStyle,
  imgClassName = '',
  style,
  rounded = true,
  onClick,
  onLoad,
  onError,
}) {
  const { ref, inView } = useInViewLite({ rootMargin, threshold, once });

  const [loaded, setLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);

  const handleLoad = useCallback(
    (e) => {
      setLoaded(true);
      onLoad?.(e);
    },
    [onLoad]
  );

  const handleError = useCallback(
    (e) => {
      setImgSrc(fallbackSrc);
      onError?.(e);
    },
    [fallbackSrc, onError]
  );

  return (
    <div
      ref={ref}
      onClick={onClick}
      className="rounded-lg overflow-hidden bg-white"
      style={{ width, height, ...wrapperStyle, boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px' }}
    >
      {inView ? (
        <Image
          src={imgSrc}
          alt={alt}
          preview={preview}
          className={['transition-opacity duration-300', imgClassName].join(' ')}
          width="100%"
          height="100%"
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            background: '#fff',
            opacity: loaded ? 1 : 0,
            ...style,
          }}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      ) : (
        placeholder ?? <SkeletonBox width={width} height={height} radius={rounded ? 12 : 0} />
      )}
    </div>
  );
});

export default LazyImage;
