npm i -g purgecss

cp ./src ./dist -r
cd dist
mkdir css
curl -o css/bootstrap.css https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.0/css/bootstrap.min.css
purgecss --css css/bootstrap.css --content index.html --output css/bootstrap.min.css
