'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { sponsorService, type Sponsor } from '@/services/sponsor.service';

interface SponsorCarouselProps {
  placement?: 'HOME_BANNER' | 'FEATURED_CAROUSEL';
  city?: string;
  autoPlay?: boolean;
  interval?: number;
}

export default function SponsorCarousel({
  placement = 'HOME_BANNER',
  city,
  autoPlay = true,
  interval = 5000,
}: SponsorCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: sponsors = [] } = useQuery({
    queryKey: ['sponsors', placement, city],
    queryFn: () => sponsorService.getByPlacement(placement, city),
    staleTime: 5 * 60 * 1000,
  });

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || sponsors.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sponsors.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, sponsors.length]);

  // Track impressions
  useEffect(() => {
    if (sponsors[currentIndex]) {
      sponsorService.recordImpression(sponsors[currentIndex].id).catch(() => {});
    }
  }, [currentIndex, sponsors]);

  if (sponsors.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + sponsors.length) % sponsors.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sponsors.length);
  };

  const handleClick = (sponsor: Sponsor) => {
    sponsorService.recordClick(sponsor.id).catch(() => {});
    if (sponsor.websiteUrl) {
      window.open(sponsor.websiteUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const currentSponsor = sponsors[currentIndex];

  return (
    <div className="relative group">
      {/* Main Banner */}
      <div
        className="relative h-48 md:h-64 lg:h-80 rounded-2xl overflow-hidden cursor-pointer"
        onClick={() => handleClick(currentSponsor)}
      >
        {currentSponsor.bannerUrl ? (
          <Image
            src={currentSponsor.bannerUrl}
            alt={currentSponsor.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={currentIndex === 0}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <div className="text-center text-white p-6">
              {currentSponsor.logoUrl && (
                <Image
                  src={currentSponsor.logoUrl}
                  alt={currentSponsor.name}
                  width={80}
                  height={80}
                  className="mx-auto mb-4 rounded-xl"
                />
              )}
              <h3 className="text-2xl font-bold mb-2">{currentSponsor.name}</h3>
              {currentSponsor.description && (
                <p className="text-orange-100">{currentSponsor.description}</p>
              )}
            </div>
          </div>
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="inline-block px-2 py-1 bg-orange-500 text-white text-xs font-medium rounded-full mb-2">
                Patrocinado
              </span>
              <h3 className="text-white text-lg md:text-xl font-bold">{currentSponsor.name}</h3>
              {currentSponsor.description && (
                <p className="text-white/80 text-sm mt-1 line-clamp-1">{currentSponsor.description}</p>
              )}
            </div>
            {currentSponsor.websiteUrl && (
              <button className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors">
                <ExternalLink className="h-5 w-5 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {sponsors.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
          >
            <ChevronRight className="h-5 w-5 text-gray-700" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {sponsors.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {sponsors.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
