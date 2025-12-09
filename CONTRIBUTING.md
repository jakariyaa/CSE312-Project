# Contributing to Digital Wallet

First off, thank you for considering contributing to the Digital Wallet project! It's people like you that make the open-source community such an amazing place to learn, inspire, and create.

Whether you're fixing a bug, improving documentation, or adding a brand-new feature, we welcome your involvement.

## 🚀 How to Contribute

We welcome contributions in several forms:

1.  **Reporting Bugs:** If you find a bug, please open an issue describing the problem and how to reproduce it.
2.  **Suggesting Features:** Have an idea? Open an issue to discuss it before you start coding.
3.  **Code Contributions:** Submit a Pull Request (PR) to fix bugs or add features.

## 🌟 Roadmap & High-Priority Features

We are currently looking for contributors to help us build the **Future Scope** of this application. If you are looking for a challenge, check out these areas:

* **KYC Verification:** Implement identity verification workflows (ID upload/verification).
* **Fraud Detection:** Create logic to flag suspicious transaction patterns.
* **Device Fingerprinting:** Implement security measures to track and verify user devices.
* **International Payments:** Integrate gateways like Stripe or Wise.
* **Multi-Currency Support:** Update the wallet logic to handle multiple currencies and exchange rates.
* **Mobile Application:** Start the React Native implementation.

## 🛠 Project Setup

To get started, you'll need **Node.js (v16+)**, **MongoDB**, and **Redis** installed locally.

### 1. Fork and Clone
1.  Fork the repository on GitHub.
2.  Clone your fork locally:
    ```bash
    git clone <your-fork-url>
    cd <repository-name>
    ```

### 2. Backend Setup
```bash
cd backend
npm install
# Create your .env file based on the Input section in README
# Ensure MongoDB, Redis, and other services are properly configured
npm run dev
````

### 3\. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## workflow Development Workflow

1.  **Create a Branch:** Always create a new branch for your work. Do not commit directly to `main`.

      * Format: `type/feature-name`
      * Examples: `feat/add-kyc`, `fix/login-error`, `docs/update-readme`

    <!-- end list -->

    ```bash
    git checkout -b feat/my-new-feature
    ```

2.  **Code Standards:**

      * **TypeScript:** We use strict TypeScript. Avoid using `any` types; define interfaces or types for your data.
      * **Linting:** Ensure your code passes ESLint rules.
      * **Styling:** We use Tailwind CSS for the frontend. Keep classes organized.

3.  **Commit Messages:**
    Please use [Conventional Commits](https://www.conventionalcommits.org/) to keep our history clean.

      * `feat: add stripe integration`
      * `fix: resolve balance calculation error`
      * `docs: update installation steps`

4.  **Push and Pull Request:**

      * Push your branch to your fork: `git push origin feat/my-new-feature`
      * Open a Pull Request against the `main` branch of the original repository.
      * Fill out the PR template (if available) or describe your changes clearly.
      * **Attach Screenshots** if your changes affect the UI.

## 🧪 Testing

  * If you add a new feature, please try to include unit tests (if the testing suite is set up).
  * Ensure the application builds without errors before submitting:
      * Frontend: `npm run build`
      * Backend: `npm run build`

## 🤝 Code of Conduct

Please note that this project is intended to be a safe, welcoming space for collaboration, and contributors are expected to adhere to a standard code of conduct. Be respectful, constructive, and kind.

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License of this project.