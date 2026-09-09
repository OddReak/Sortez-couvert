import { Section, StaticPage } from './StaticPage';

const UPDATED = '9 septembre 2026';
const REPO = 'https://github.com/OddReak/Sortez-couvert';

export function PrivacyPage() {
  return (
    <StaticPage title="Confidentialité">
      <p className="ink-muted text-sm">
        Terra est un projet personnel, sans finalité commerciale. Cette page
        décrit les données traitées et pourquoi. Dernière mise à jour :{' '}
        {UPDATED}.
      </p>

      <Section heading="Responsable">
        <p>
          Le projet est édité et hébergé à titre personnel par son auteur
          (compte GitHub <span className="font-medium">OddReak</span>).
        </p>
      </Section>

      <Section heading="Ce qui est transmis au service météo (Foreca)">
        <p>
          Pour afficher la météo, Terra transmet à son proxy puis à{' '}
          <span className="font-medium">Foreca</span> (le fournisseur de
          données) :
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            vos <span className="font-medium">coordonnées GPS</span>, uniquement
            si vous autorisez la géolocalisation ;
          </li>
          <li>le nom de la ville que vous recherchez.</li>
        </ul>
        <p>
          Ces informations servent seulement à obtenir les prévisions du lieu
          concerné. Elles ne sont{' '}
          <span className="font-medium">ni journalisées ni conservées</span> sur
          le serveur : les journaux ne contiennent que des messages d’erreur
          techniques.
        </p>
        <p>
          Votre adresse IP sert uniquement de clé temporaire pour limiter le
          nombre de requêtes (stockée moins d’une minute, jamais journalisée).
        </p>
      </Section>

      <Section heading="Ce qui reste sur votre appareil">
        <p>
          Le lieu courant, vos favoris (8 maximum), l’historique de recherche,
          vos réglages et le dernier relevé météo de chaque lieu sont
          enregistrés <span className="font-medium">localement</span> (IndexedDB
          / stockage du navigateur). Ces données ne quittent jamais l’appareil
          et ne sont accessibles qu’à vous.
        </p>
        <p>
          Vous pouvez tout effacer à tout moment :{' '}
          <span className="font-medium">Réglages → « Effacer mes lieux »</span>.
          Sur iPhone, ce stockage peut aussi être purgé automatiquement après
          environ 7 jours sans utilisation.
        </p>
      </Section>

      <Section heading="Mesure d’audience">
        <p>
          Terra utilise <span className="font-medium">Vercel Analytics</span> et{' '}
          <span className="font-medium">Vercel Speed Insights</span> :
          statistiques de fréquentation et de performance{' '}
          <span className="font-medium">agrégées et anonymes</span>, sans cookie
          et sans profilage individuel. Vercel Inc. agit comme sous-traitant.
        </p>
      </Section>

      <Section heading="Base légale et durées">
        <p>
          Fourniture du service (intérêt légitime) ; consentement pour la
          géolocalisation, révocable dans les réglages de votre navigateur ou de
          votre téléphone.
        </p>
        <p>
          Coordonnées : le temps de la requête. Cache serveur : de quelques
          minutes à 30 jours (selon le type de donnée Foreca). Données locales :
          jusqu’à effacement.
        </p>
      </Section>

      <Section heading="Hébergement">
        <p>
          Vercel (Union européenne) ; les fonctions serveur s’exécutent dans la
          région de Paris.
        </p>
      </Section>

      <Section heading="Vos droits">
        <p>
          L’essentiel de vos données étant local, vous les maîtrisez directement
          via le bouton d’effacement. Pour toute question ou demande, ouvrez une{' '}
          <a
            href={REPO}
            className="font-medium underline"
            target="_blank"
            rel="noreferrer"
          >
            issue sur le dépôt GitHub
          </a>
          .
        </p>
      </Section>
    </StaticPage>
  );
}
