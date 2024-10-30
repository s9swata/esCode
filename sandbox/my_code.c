int main() {
    int a, b;
    FILE *inputFile = fopen("input.txt", "r");
    FILE *outputFile = fopen("output.txt", "w");

    // Check if files opened successfully
    if (inputFile == NULL) {
        printf("Error opening input file.\n");
        return 1;
    }
    if (outputFile == NULL) {
        printf("Error opening output file.\n");
        fclose(inputFile); // Close inputFile if outputFile fails to open
        return 1;
    }

    // Read each line and process each test case
    while (fscanf(inputFile, "%d %d", &a, &b) == 2) {
        int result = func(a,b); // Calculate sum
        fprintf(outputFile, "%d\n", result); // Write result to output file
    }

    // Close files
    fclose(inputFile);
    fclose(outputFile);

    printf("Results have been written to output.txt\n");
    return 0;
}
