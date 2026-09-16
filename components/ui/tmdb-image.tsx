"use client";

import Image, { type ImageProps, type ImageLoaderProps } from "next/image";

function imageWidths(src: string) {
  return /\/t\/p\/w1280\//.test(src) ? [300, 780, 1280] : [92, 154, 185, 342, 500, 780];
}

export function tmdbImageLoader({ src, width }: ImageLoaderProps) {
  const sizes = imageWidths(src);
  const size = sizes.find(size => size >= width) || sizes[sizes.length - 1];
  return src.replace(/\/t\/p\/(?:w\d+|original)\//, `/t/p/w${size}/`);
}

// TMDB already serves resized CDN images. Native srcSet keeps this independent
// of the global Next image optimizer setting used for other image sources.
export function TmdbImage(props: ImageProps) {
  if (typeof props.src !== "string" || !props.src.startsWith("https://image.tmdb.org/t/p/")) {
    return <Image {...props} />;
  }
  const { src, alt, fill, sizes, width, height, className, style, priority, loading, fetchPriority, onLoad, onError, id, title } = props;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      srcSet={imageWidths(src).map(size => `${tmdbImageLoader({src, width: size})} ${size}w`).join(", ")}
      sizes={sizes || (fill ? "100vw" : `${width || 500}px`)}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      style={fill ? {position: "absolute", inset: 0, width: "100%", height: "100%", ...style} : style}
      loading={priority ? "eager" : loading || "lazy"}
      fetchPriority={priority ? "high" : fetchPriority}
      decoding="async"
      onLoad={onLoad}
      onError={onError}
      id={id}
      title={title}
    />
  );
}
