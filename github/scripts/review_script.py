# 🛠 Copilot: per favore analizza il seguente codice.
# ✅ Controlla eventuali bug logici, problemi di sicurezza e vulnerabilità.
# ✅ Suggerisci ottimizzazioni per performance e leggibilità.
# ✅ Verifica che il codice sia conforme alle best practice Python 3.
# ✅ Se opportuno, proponi funzioni più pulite, nomi di variabili migliori e gestione degli errori.
# ✅ Evidenzia parti del codice che potrebbero creare conflitti o essere migliorate.

name: GPT-4 Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install openai

      - name: Run code review script
        run: python scripts/review_script.py
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

# Repository URL
# REPO_URL = "https://github.com/lukeeterna/dropevolutionproject"
