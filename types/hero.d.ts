export interface HeroButton {
    text: string;
    link: string;
  }
  
  export interface HeroImageAsset {
    _id: string;
    url: string;
    metadata?: {
      dimensions?: {
        width: number;
        height: number;
      };
      palette?: {
        dominant?: {
          background?: string;
          foreground?: string;
        };
      };
    };
  }
  
  export interface HeroBackgroundImage {
    asset: HeroImageAsset;
    hotspot?: {
      x: number;
      y: number;
      height: number;
      width: number;
    };
    crop?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  }
  
  export interface HeroData {
    title: string;
    subtitle?: string;
    description?: string;
    primaryButton?: HeroButton;
    backgroundImageDesktop: HeroBackgroundImage;
    backgroundImageTablet?: HeroBackgroundImage;
    backgroundImageMobile?: HeroBackgroundImage;
  }
  
  export interface HeroSectionProps {
    heroData?: HeroData;
  }