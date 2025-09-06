git pull
php artisan migrate
cd FloodReliefApp
npm install --legacy-peer-deps
npm run build
sudo rm -rf /var/www/spa
sudo cp -r dist /var/www/spa

