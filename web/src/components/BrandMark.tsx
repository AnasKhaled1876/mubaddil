import React from 'react';

interface BrandMarkProps {
  className?: string;
}

/** The I-beam favicon, used as the site logo so the tab icon and page logo match. */
export const BrandMark: React.FC<BrandMarkProps> = ({ className }) => (
  <img src="/favicon.svg" alt="" aria-hidden="true" className={className} draggable={false} />
);
