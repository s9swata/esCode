# Use a lightweight image with gcc installed
FROM gcc:4.9

# Set the working directory in the container
WORKDIR /app

# Copy your C code to the container
COPY my_code.c /app

COPY input.txt /app

COPY output.txt /app

RUN ls -la

# Compile the C code
RUN gcc -o my_program my_code.c

# Set the entry point to run the compiled program
CMD ["./my_program"]

