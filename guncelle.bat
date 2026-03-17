@echo off
echo 1. Excel verileri okunuyor ve index.html guncelleniyor...
py update_catalog.py

echo.
echo 2. Degisiklikler GitHub'a gonderiliyor...
git add .
git commit -m "Katalog otomatik olarak guncellendi"
git push origin main

echo.
echo Islem basariyla tamamlandi! Github sayfaniz 1-2 dakika icinde yayinda olacak.
pause