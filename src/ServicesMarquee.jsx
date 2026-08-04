import TiltedCard from './TiltedCard.jsx';
import { useLanguage } from './i18n.jsx';
import './TiltedCard.css';

const serviceCards = [
  {
    titleKey: 'services.rootCanal.title',
    sentenceKey: 'services.rootCanal.desc',
    image: 'https://images.unsplash.com/photo-1643401142249-84ef35c123c9?q=75&w=700&auto=format&fit=crop'
  },
  {
    titleKey: 'services.denture.title',
    sentenceKey: 'services.denture.desc',
    image: 'https://images.unsplash.com/photo-1562330743-fbc6ef07ca78?q=75&w=700&auto=format&fit=crop'
  },
  {
    titleKey: 'services.crown.title',
    sentenceKey: 'services.crown.desc',
    image: 'https://images.unsplash.com/photo-1593022356769-11f762e25ed9?q=75&w=700&auto=format&fit=crop'
  },
  {
    titleKey: 'services.cosmetic.title',
    sentenceKey: 'services.cosmetic.desc',
    image: 'https://images.unsplash.com/photo-1677026010083-78ec7f1b84ed?q=75&w=700&auto=format&fit=crop'
  },
  {
    titleKey: 'services.hair.title',
    sentenceKey: 'services.hair.desc',
    image: 'https://images.unsplash.com/photo-1643837833100-8b2ebd7127bc?q=75&w=700&auto=format&fit=crop'
  }
];

function ServicesMarquee() {
  const { t } = useLanguage();
  const loopedCards = [...serviceCards, ...serviceCards];
  return (
    <div className="services-marquee">
      <div className="services-track">
        {loopedCards.map((card, index) => (
          <div className="services-tilt-item" key={`${card.titleKey}-${index}`}>
            <TiltedCard
              imageSrc={card.image}
              altText={t(card.titleKey)}
              containerHeight="100%"
              containerWidth="100%"
              imageHeight="100%"
              imageWidth="100%"
              rotateAmplitude={10}
              scaleOnHover={1.05}
              showMobileWarning={false}
              showTooltip={false}
              displayOverlayContent
              overlayContent={
                <div className="services-overlay-text">
                  <h3>{t(card.titleKey)}</h3>
                  <p>{t(card.sentenceKey)}</p>
                </div>
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ServicesMarquee;
