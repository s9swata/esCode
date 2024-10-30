rm -rf ./output.txt
touch ./output.txt
docker build -t myapp .
docker run -v $(pwd)/app --rm myapp < ./input.txt > ./output.txt
cat ./output.txt
