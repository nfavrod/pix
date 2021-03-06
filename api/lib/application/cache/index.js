const securityController = require('../../interfaces/controllers/security-controller');
const CacheController = require('./cache-controller');

exports.register = async function(server) {
  server.route([
    {
      method: 'DELETE',
      path: '/api/cache/{cachekey}',
      config: {
        pre: [{
          method: securityController.checkUserHasRolePixMaster,
          assign: 'hasRolePixMaster'
        }],
        handler: CacheController.reloadCacheEntry,
        tags: ['api', 'cache'],
        notes: [
          'Cette route est restreinte aux utilisateurs authentifiés avec le rôle Pix Master',
          'Elle permet de supprimer une entrée du cache de l’application\n' +
          'La clé de cache doit avoir la forme {table}_{id}, par exemple Epreuves_recABCDEF\n' +
          'Attention : pour un état cohérent des objets stockés en cache, utiliser DELETE /api/cache'
        ]
      }
    },{
      method: 'DELETE',
      path: '/api/cache',
      config: {
        pre: [{
          method: securityController.checkUserHasRolePixMaster,
          assign: 'hasRolePixMaster'
        }],
        handler: CacheController.removeAllCacheEntries,
        tags: ['api', 'cache'],
        notes: [
          'Cette route est restreinte aux utilisateurs authentifiés avec le rôle Pix Master',
          'Elle permet de supprimer toutes les entrées du cache de l’application',
        ]
      }
    },{
      method: 'PATCH',
      path: '/api/cache',
      config: {
        pre: [{
          method: securityController.checkUserHasRolePixMaster,
          assign: 'hasRolePixMaster'
        }],
        handler: CacheController.preloadCacheEntries,
        tags: ['api', 'cache'],
        notes: [
          'Cette route est restreinte aux utilisateurs authentifiés avec le rôle Pix Master',
          'Elle permet de précharger les entrées du cache de l’application (les requêtes les plus longues)',
        ]
      }
    }
  ]);
};

exports.name = 'cache-api';
