#! /bin/bash
if [ $NODE_ENV = "integration" ]
then
  echo "Run DB:SEED"
  npm run db:seed
fi
