Feature: Connexion

  Scenario: Je me connecte
    Given je vais sur Pix
    When je me connecte avec le compte "userpix1@example.net"
    Then je suis redirigé vers le compte de "Pix Aile"
