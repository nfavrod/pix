Feature: Campagne

  Scenario: Je commence mon parcours prescrit
    Given je vais sur Pix
    And je suis connecté à Pix
    When je vais sur la campagne "AZERTY456"
    Then je vois la page de "presentation" de la campagne
    When je clique sur "Je commence"
    Then je vois la page de "didacticiel" de la campagne
