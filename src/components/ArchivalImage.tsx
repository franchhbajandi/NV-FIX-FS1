import React from 'react';
import { assetsManifest, ArchivalAsset } from '../data/assetsManifest';
import { Image as ImageIcon, Camera, PenTool } from 'lucide-react';

interface ArchivalImageProps {
  assetId: string;
  className?: string;
  priority?: boolean;
}

export const ArchivalImage: React.FC<ArchivalImageProps> = ({
  assetId,
  className = '',
  priority = false,
}) => {
  const asset: ArchivalAsset | undefined = assetsManifest[assetId];

  if (!asset) {
    if (import.meta.env.DEV) {
      return (
        <div className="p-3 border-2 border-[#FF3D1F] bg-white text-[#FF3D1F] font-mono text-xs shadow-[2px_2px_0px_#FF3D1F]">
          [Photo Discovery Notice: Asset "{assetId}" pending placement]
        </div>
      );
    }
    return null;
  }

  // 1. Production Mode: Gated Cleanliness
  // If no image file is supplied yet, return null in production builds
  if (!asset.src) {
    if (!import.meta.env.DEV) {
      return null;
    }

    // 2. Development Mode: Electric Editorial Draft Frame (No paper craft)
    return (
      <div
        className={`relative my-4 border-2 border-dashed border-[#2447FF]/60 bg-[#12121A] text-[#F5F6F8] p-5 rounded-[2px] shadow-[4px_4px_0px_#2447FF] transition-transform ${className}`}
        style={{
          aspectRatio: `${asset.width} / ${asset.height}`,
          maxWidth: '100%',
        }}
      >
        {/* Electric Editorial Viewfinder Brackets */}
        <span className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#E8FF3A]" />
        <span className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#E8FF3A]" />
        <span className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#E8FF3A]" />
        <span className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#E8FF3A]" />

        <div className="h-full flex flex-col items-center justify-center text-center p-3 font-mono space-y-1 select-none">
          <div className="p-2 rounded-[2px] bg-white/10 text-[#E8FF3A] mb-1">
            {asset.type === 'photo' && <Camera size={18} />}
            {asset.type === 'sketch' && <PenTool size={18} />}
            {asset.type === 'cutout' && <ImageIcon size={18} />}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#E8FF3A]">
            [DRAFT SLOT] {asset.id}
          </span>
          <span className="text-xs font-bold text-white">
            {asset.width} × {asset.height} px · {asset.type.toUpperCase()}
          </span>
          <p className="text-[11px] text-[#8E90A4] italic max-w-md font-sans">
            Alt: “{asset.alt}”
          </p>
        </div>
      </div>
    );
  }

  // 3. Asset Supplied: Electric Editorial Frame with offset color block & viewfinder brackets
  return (
    <figure className={`relative my-6 break-inside-avoid ${className}`}>
      <div className="relative p-2.5 bg-[#12121A] text-[#F5F6F8] border-2 border-[#0B0B10] shadow-[5px_5px_0px_#2447FF] rounded-[2px]">
        {/* Viewfinder Brackets */}
        <span className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#E8FF3A] z-10" />
        <span className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#E8FF3A] z-10" />
        <span className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#E8FF3A] z-10" />
        <span className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#E8FF3A] z-10" />

        <div className="overflow-hidden border border-[#F5F6F8]/20 bg-[#0B0B10]">
          <img
            src={asset.src}
            alt={asset.alt}
            width={asset.width}
            height={asset.height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="w-full h-auto object-cover select-none transition-transform duration-300 hover:scale-[1.02]"
            style={{
              aspectRatio: `${asset.width} / ${asset.height}`,
            }}
          />
        </div>

        {(asset.caption || asset.credit) && (
          <figcaption className="mt-2 pt-1.5 border-t border-[#F5F6F8]/15 text-xs font-mono text-[#8E90A4] flex flex-wrap items-baseline justify-between gap-1 px-1">
            {asset.caption && <span className="text-[#F5F6F8] font-sans text-xs">{asset.caption}</span>}
            {asset.credit && <span className="text-[10px] text-[#E8FF3A] font-bold uppercase">[{asset.credit}]</span>}
          </figcaption>
        )}
      </div>
    </figure>
  );
};
