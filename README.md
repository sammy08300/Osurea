# Visualiseur d'Area pour osu!

Ce projet est une application web conçue pour aider les joueurs d'osu! à visualiser, configurer et gérer les zones actives de leur tablette graphique. Il offre une interface interactive pour définir précisément la zone de jeu et sauvegarder les configurations préférées.

## Fonctionnalités Principales

*   **Visualisation Interactive :** Affiche la tablette et la zone active définie par l'utilisateur dans un conteneur visuel. La zone active peut être redimensionnée et déplacée (fonctionnalité de glisser-déposer probable, bien que non explicitement dans ces extraits).
*   **Configuration de la Tablette :**
    *   Choix parmi des préréglages de tablettes courantes.
    *   Possibilité de saisir manuellement la largeur et la hauteur de la tablette.
*   **Configuration de la Zone Active :**
    *   Saisie précise de la largeur et de la hauteur de la zone active (en mm).
    *   Saisie précise du décalage (offset X et Y) de la zone active par rapport au centre ou à un coin (le code suggère un offset par rapport au centre avec le bouton "Copier Infos").
    *   Option pour verrouiller le ratio largeur/hauteur de la zone active.
    *   Saisie d'un ratio personnalisé.
*   **Outils Pratiques :**
    *   **Inverser Dimensions :** Bouton pour échanger rapidement la largeur et la hauteur de la zone active.
    *   **Centrer :** Bouton pour centrer automatiquement la zone active sur la tablette.
    *   **Copier Infos :** Copie les détails de la zone active (largeur, hauteur, ratio, offset X/Y) dans le presse-papiers pour une utilisation facile ailleurs.
    *   **Grille :** Option pour afficher/masquer une grille d'arrière-plan pour une meilleure perception des dimensions et de la position.
    *   **(Probable) Menu Contextuel :** Un menu contextuel (clic droit sur la zone ?) offre des options d'alignement rapide (gauche, centre H, droite, haut, centre V, bas, centrer tout).
*   **Gestion des Favoris :**
    *   **Sauvegarder :** Enregistre la configuration actuelle (dimensions tablette, dimensions zone, offsets, ratio, nom/commentaire) comme favori dans le stockage local du navigateur.
    *   **Charger :** Charge une configuration favorite sauvegardée dans les champs de saisie et met à jour la visualisation.
    *   **Modifier :** Permet de modifier un favori existant (nom, et potentiellement les valeurs).
    *   **Supprimer :** Supprime un favori de la liste.
    *   **Trier :** Trie la liste des favoris par date d'ajout, nom ou taille (surface).
*   **Récapitulatif :** Affiche un résumé des dimensions et ratios de la tablette et de la zone active, ainsi que la surface et la position de la zone.
*   **Interface Utilisateur :**
    *   Construite avec Tailwind CSS pour un design moderne et réactif.
    *   Notifications pour informer l'utilisateur des actions (ex: copie réussie, favori sauvegardé/supprimé).
    *   Interface en Français.

## Technologies Utilisées

*   HTML
*   CSS (Tailwind CSS)
*   JavaScript (pour l'interactivité, les calculs, la manipulation du DOM et la gestion du stockage local)

Ce visualiseur vise à fournir un outil complet et facile à utiliser pour les joueurs d'osu! souhaitant optimiser et gérer leurs paramètres de tablette.
