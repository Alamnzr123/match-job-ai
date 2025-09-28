# Next.js CV Evaluator

This project is a Next.js application that allows users to upload CVs, evaluate them against job vacancy descriptions, and retrieve match rates and scoring using an AI workflow with LLM prompts.

## Features

- Upload CVs in various formats (PDF, DOCX, plain text).
- Evaluate CVs against job descriptions using AI.
- Retrieve evaluation results with match rates and scoring.

## Project Structure

```
nextjs-cv-evaluator
├── src
│   ├── pages
│   │   └── api
│   │       ├── upload-cv.ts
│   │       ├── evaluate-cv.ts
│   │       └── get-results.ts
│   ├── utils
│   │   ├── aiEvaluator.ts
│   │   └── fileHandler.ts
│   ├── types
│   │   └── index.ts
│   └── workflows
│       └── llmPrompt.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd nextjs-cv-evaluator
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Upload CV

- **Endpoint:** `/api/upload-cv`
- **Method:** POST
- **Description:** Uploads a CV file for evaluation.

### Evaluate CV

- **Endpoint:** `/api/evaluate-cv`
- **Method:** POST
- **Description:** Initiates the evaluation of the uploaded CV and returns an evaluation ID and status.

### Get Results

- **Endpoint:** `/api/get-results`
- **Method:** GET
- **Description:** Retrieves the evaluation results based on the provided evaluation ID.

## Usage Examples

### Uploading a CV

Use a tool like Postman or curl to send a POST request to `/api/upload-cv` with the CV file.

### Evaluating a CV

After uploading, send a POST request to `/api/evaluate-cv` with the evaluation ID received from the upload response.

### Retrieving Results

Send a GET request to `/api/get-results` with the evaluation ID to get the evaluation results.

## License

This project is licensed under the MIT License.
