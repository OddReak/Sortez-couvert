import { Link } from '@/app/router';

import { Section, StaticPage } from './StaticPage';

export function HelpPage() {
  return (
    <StaticPage title="Aide">
      <p className="ink-muted text-sm">
        Terra montre la météo sur un globe terrestre : vous faites tourner une
        bague pour parcourir les heures, et le soleil, le fond et les mesures
        suivent le moment choisi.
      </p>

      <Section heading="Installer Terra sur votre écran d’accueil">
        <p>
          <span className="font-medium">iPhone / iPad (Safari)</span> : touchez
          le bouton Partager (carré avec une flèche), puis « Ajouter à l’écran
          d’accueil ». Terra s’ouvrira alors en plein écran, comme une
          application.
        </p>
        <p>
          <span className="font-medium">Android / ordinateur</span> : un bouton
          « Installer » apparaît dans la barre d’adresse ou dans les réglages de
          Terra.
        </p>
      </Section>

      <Section heading="Se repérer">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium">La bague</span> autour du globe :
            tournez-la pour avancer ou reculer dans le temps. Double-touchez-la
            pour revenir à « maintenant ».
          </li>
          <li>
            <span className="font-medium">Les mesures</span> en bas (vent,
            humidité, UV, qualité de l’air) : touchez-en une pour voir le détail
            et un graphique sur 24 h.
          </li>
          <li>
            <span className="font-medium">Le menu</span> (en haut à gauche) :
            vos lieux favoris, les prévisions sur 7 jours et les réglages.
          </li>
          <li>
            <span className="font-medium">La loupe</span> (en haut à droite) :
            chercher et ajouter une ville.
          </li>
        </ul>
      </Section>

      <Section heading="Sans connexion">
        <p>
          Le dernier relevé de chaque lieu reste consultable hors ligne, avec un
          bandeau « Données du … » qui rappelle sa date.
        </p>
      </Section>

      <Section heading="Limites connues sur iPhone">
        <p>
          Ce sont des contraintes de Safari, pas des bugs : pas de vibration au
          passage d’heure (remplacée par un effet visuel), pas de notifications,
          pas de mise à jour des données quand l’app est fermée.
        </p>
      </Section>

      <p className="ink-muted text-sm">
        <Link to="/confidentialite" className="underline">
          Confidentialité
        </Link>
      </p>
    </StaticPage>
  );
}
