import * as THREE from 'three';
import { WeatherType, TimeOfDay } from '../../types';

export interface AtmosphereSettings {
  skyColor: number;
  sunColor: number;
  sunIntensity: number;
  sunPos: [number, number, number];
  ambientColor: number;
  ambientIntensity: number;
  hemiSkyColor: number;
  hemiGroundColor: number;
  hemiIntensity: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  exposure: number;
  starsOpacity: number;
  rainOpacity: number;
}

/**
 * Computes harmonious, soft, cinematic lighting parameters
 * tailored to time-of-day and weather cycles.
 */
export function getAtmosphereSettings(time: TimeOfDay, weather: WeatherType): AtmosphereSettings {
  let skyColor = 0x60a5fa;
  let sunColor = 0xffedd5;
  let sunIntensity = 1.35;
  let sunPos: [number, number, number] = [28, 42, -25];
  let ambientColor = 0x93c5fd;
  let ambientIntensity = 0.55;
  let hemiSkyColor = 0xbfe3ff;
  let hemiGroundColor = 0x3d4f3b;
  let hemiIntensity = 0.6;
  let fogColor = 0xb2d9fb;
  let fogNear = 35;
  let fogFar = 135;
  let exposure = 1.05;
  let starsOpacity = 0;
  let rainOpacity = 0;

  switch (time) {
    case 'MORNING':
      // Soft golden pastel sunrise
      skyColor = 0xfbcfe8; // Rose dawn
      sunColor = 0xfef08a; // Golden lemon
      sunIntensity = 1.25;
      sunPos = [-35, 22, -45];
      ambientColor = 0xfce7f3;
      ambientIntensity = 0.65;
      hemiSkyColor = 0xfecdd3;
      hemiGroundColor = 0x2e4635;
      hemiIntensity = 0.65;
      fogColor = 0xfce7f3;
      fogNear = 25;
      fogFar = 120;
      exposure = 1.0;
      starsOpacity = 0;
      break;

    case 'DAY':
      // Vibrant cozy sunny day with clear shadows
      skyColor = 0x38bdf8; // Sky blue
      sunColor = 0xfffbeb; // Warm ivory
      sunIntensity = 1.45;
      sunPos = [24, 48, -15];
      ambientColor = 0xbae6fd;
      ambientIntensity = 0.55;
      hemiSkyColor = 0xe0f2fe;
      hemiGroundColor = 0x2b4c2b;
      hemiIntensity = 0.7;
      fogColor = 0xb9e4fc;
      fogNear = 40;
      fogFar = 145;
      exposure = 1.08;
      starsOpacity = 0;
      break;

    case 'AFTERNOON':
      // Warm golden hour
      skyColor = 0xfb923c;
      sunColor = 0xfde047;
      sunIntensity = 1.4;
      sunPos = [40, 24, -30];
      ambientColor = 0xfed7aa;
      ambientIntensity = 0.6;
      hemiSkyColor = 0xfed7aa;
      hemiGroundColor = 0x3f4f2c;
      hemiIntensity = 0.65;
      fogColor = 0xfed7aa;
      fogNear = 30;
      fogFar = 130;
      exposure = 1.05;
      starsOpacity = 0;
      break;

    case 'SUNSET':
      // Dramatic magenta / violet dusk
      skyColor = 0x7e22ce; // Deep violet
      sunColor = 0xf97316; // Fiery amber
      sunIntensity = 1.1;
      sunPos = [45, 12, -45];
      ambientColor = 0xa855f7;
      ambientIntensity = 0.45;
      hemiSkyColor = 0xd946ef;
      hemiGroundColor = 0x202b28;
      hemiIntensity = 0.55;
      fogColor = 0x9333ea;
      fogNear = 20;
      fogFar = 110;
      exposure = 0.95;
      starsOpacity = 0.3;
      break;

    case 'NIGHT':
      // Serene moonlit twilight with glowing lanterns
      skyColor = 0x091428;
      sunColor = 0x93c5fd; // Moon silver blue
      sunIntensity = 0.55;
      sunPos = [-25, 35, -20];
      ambientColor = 0x1e293b;
      ambientIntensity = 0.35;
      hemiSkyColor = 0x1e3a5f;
      hemiGroundColor = 0x0d1912;
      hemiIntensity = 0.45;
      fogColor = 0x0f172a;
      fogNear = 20;
      fogFar = 95;
      exposure = 0.9;
      starsOpacity = 0.9;
      break;
  }

  // Weather modulation
  if (weather === 'CLOUDY') {
    skyColor = 0x64748b;
    sunIntensity *= 0.55;
    ambientIntensity *= 0.8;
    hemiIntensity *= 0.75;
    fogColor = 0x94a3b8;
    fogNear = 20;
    fogFar = 95;
  } else if (weather === 'RAIN') {
    skyColor = 0x475569;
    sunIntensity *= 0.35;
    ambientIntensity *= 0.65;
    fogColor = 0x64748b;
    fogNear = 15;
    fogFar = 80;
    rainOpacity = 0.65;
  } else if (weather === 'HEAVY_RAIN') {
    skyColor = 0x334155;
    sunIntensity *= 0.2;
    ambientIntensity *= 0.5;
    fogColor = 0x475569;
    fogNear = 10;
    fogFar = 65;
    rainOpacity = 0.95;
  } else if (weather === 'FOG') {
    skyColor = 0xcfd8dc;
    sunIntensity *= 0.35;
    ambientIntensity *= 0.85;
    fogColor = 0xdbeafe;
    fogNear = 8;
    fogFar = 55;
  }

  return {
    skyColor,
    sunColor,
    sunIntensity,
    sunPos,
    ambientColor,
    ambientIntensity,
    hemiSkyColor,
    hemiGroundColor,
    hemiIntensity,
    fogColor,
    fogNear,
    fogFar,
    exposure,
    starsOpacity,
    rainOpacity,
  };
}
