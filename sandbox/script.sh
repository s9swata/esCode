docker build -t myapp .
docker run -v $(pwd)/app --rm myapp < input.txt > output.txt
